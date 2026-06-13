import { useState, useEffect, useCallback } from "react";
import { Node } from "@/lib/types";
import { updateNode } from "@/lib/actions/nodes";

export interface ActiveInteraction {
  nodeId: string;
  type: "move" | "resize-left" | "resize-right";
  startX: number;
  startY: number;
  originalLeft: number;
  originalWidth: number;
  originalRow: number;
}

export interface PendingExtension {
  parentNodeId: string;
  parentTitle: string;
  childTitle: string;
  updatedParentStart: string;
  updatedParentEnd: string;
}

export function useGanttInteraction(
  projectId: string,
  nodes: Node[],
  viewScale: "days" | "weeks",
  getDescendantNodeIds: (id: string) => string[]
) {
  const [interaction, setInteraction] = useState<ActiveInteraction | null>(null);
  const [optimisticChanges, setOptimisticChanges] = useState<Record<string, { leftOffset: number; widthOffset: number; rowOffset: number }>>({});
  const [pendingExtension, setPendingExtension] = useState<PendingExtension | null>(null);

  const handleMouseDown = useCallback((nodeId: string, startCol: number, endCol: number | null, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    let type: "move" | "resize-left" | "resize-right" = "move";
    if (target.className.includes("handle-left")) type = "resize-left";
    else if (target.className.includes("handle-right")) type = "resize-right";

    let originalLeft = 0, originalWidth = 0;
    if (viewScale === "days") {
      originalLeft = startCol * 40;
      originalWidth = (endCol !== null) ? Math.max(40, (endCol - startCol + 1) * 40) : 120;
    } else {
      originalLeft = (startCol / 7) * 140;
      originalWidth = (endCol !== null) ? Math.max(20, ((endCol - startCol + 1) / 7) * 140) : 60;
    }

    setInteraction({ nodeId, type, startX: e.clientX, startY: e.clientY, originalLeft, originalWidth, originalRow: 0 });
  }, [viewScale]);

  useEffect(() => {
    if (!interaction) return;

    const scaleFactor = viewScale === "days" ? 40 : 20;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - interaction.startX;
      const deltaPixels = Math.round(deltaX / scaleFactor) * scaleFactor;
      const descendants = getDescendantNodeIds(interaction.nodeId);

      setOptimisticChanges(prev => {
        const next = { ...prev };
        if (interaction.type === "move") {
          next[interaction.nodeId] = { leftOffset: deltaPixels, widthOffset: 0, rowOffset: 0 };
          descendants.forEach(d => next[d] = { leftOffset: deltaPixels, widthOffset: 0, rowOffset: 0 });
        } else if (interaction.type === "resize-left") {
          const leftOffset = Math.min(deltaPixels, interaction.originalWidth - scaleFactor);
          next[interaction.nodeId] = { leftOffset, widthOffset: -leftOffset, rowOffset: 0 };
        } else if (interaction.type === "resize-right") {
          const widthOffset = Math.max(deltaPixels, scaleFactor - interaction.originalWidth);
          next[interaction.nodeId] = { leftOffset: 0, widthOffset, rowOffset: 0 };
        }
        return next;
      });
    };

    const handleMouseUp = async () => {
      const opt = optimisticChanges[interaction.nodeId];
      const deltaDays = opt ? Math.round(opt.leftOffset / scaleFactor) : 0;
      const deltaWidthDays = opt ? Math.round(opt.widthOffset / scaleFactor) : 0;
      const descendants = getDescendantNodeIds(interaction.nodeId);

      setInteraction(null);

      if (deltaDays !== 0 || deltaWidthDays !== 0) {
        const targetNode = nodes.find(n => n.id === interaction.nodeId);
        if (targetNode) {
          const originalStart = new Date(targetNode.startDate || targetNode.createdAt);
          const originalEnd = targetNode.endDate ? new Date(targetNode.endDate) : new Date(originalStart);

          const newStart = new Date(originalStart);
          newStart.setDate(newStart.getDate() + deltaDays);

          const newEnd = new Date(originalEnd);
          if (interaction.type === "move") newEnd.setDate(newEnd.getDate() + deltaDays);
          else if (interaction.type === "resize-right") newEnd.setDate(newEnd.getDate() + deltaWidthDays);
          else if (interaction.type === "resize-left") newEnd.setDate(newEnd.getDate() + deltaDays + deltaWidthDays);

          try {
            await updateNode(projectId, targetNode.id, { startDate: newStart.toISOString(), endDate: newEnd.toISOString() });

            if (interaction.type === "move" && deltaDays !== 0 && descendants.length > 0) {
              await Promise.all(descendants.map(async (descId) => {
                const descNode = nodes.find(n => n.id === descId);
                if (descNode) {
                  const dStart = new Date(descNode.startDate || descNode.createdAt);
                  const dEnd = descNode.endDate ? new Date(descNode.endDate) : new Date(dStart);
                  dStart.setDate(dStart.getDate() + deltaDays);
                  dEnd.setDate(dEnd.getDate() + deltaDays);
                  await updateNode(projectId, descNode.id, { startDate: dStart.toISOString(), endDate: dEnd.toISOString() });
                }
              }));
            }

            const parentNode = targetNode.parentLinks?.[0]?.parentNode;
            if (parentNode) {
              const pStart = new Date(parentNode.startDate || parentNode.createdAt);
              const pEnd = new Date(parentNode.endDate || pStart);

              if (newStart < pStart || newEnd > pEnd) {
                setPendingExtension({
                  parentNodeId: parentNode.id,
                  parentTitle: parentNode.title,
                  childTitle: targetNode.title,
                  updatedParentStart: (newStart < pStart ? newStart : pStart).toISOString(),
                  updatedParentEnd: (newEnd > pEnd ? newEnd : pEnd).toISOString()
                });
              }
            }
          } catch (err) {
            console.error("Error updating dates:", err);
          } finally {
            setOptimisticChanges(prev => {
              const next = { ...prev };
              delete next[interaction.nodeId];
              descendants.forEach(d => delete next[d]);
              return next;
            });
          }
        }
      } else {
        setOptimisticChanges(prev => {
          const next = { ...prev };
          delete next[interaction.nodeId];
          descendants.forEach(d => delete next[d]);
          return next;
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [interaction, optimisticChanges, nodes, projectId, getDescendantNodeIds, viewScale]);

  return { interaction, optimisticChanges, pendingExtension, setPendingExtension, handleMouseDown };
}
