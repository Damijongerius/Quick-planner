"use client";

import React, { useMemo, useState, useEffect, useCallback } from "react";
import { Node } from "@/lib/types";
import { updateNode } from "@/lib/actions/nodes";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { AlertCircle } from "lucide-react";

interface GanttNodeSectionProps {
  projectId: string;
  nodes: Node[];
  days: Date[];
  weeks: Date[];
  viewScale: "days" | "weeks";
  getDayOffset: (date: string | Date | null | undefined) => number | null;
  boardLevelView?: string;
  rowTypeIds?: string[];
  cardTypeIds?: string[];
  onHover: (e: React.MouseEvent | null, content: { title: string; subtitle?: string; badge?: string; badgeColor?: string } | null) => void;
  onMouseMove: (e: React.MouseEvent) => void;
}

interface ActiveInteraction {
  nodeId: string;
  type: "move" | "resize-left" | "resize-right";
  startX: number;
  startY: number;
  originalLeft: number;
  originalWidth: number;
  originalRow: number;
}

export function GanttNodeSection({
  projectId,
  nodes,
  days,
  weeks,
  viewScale,
  getDayOffset,
  boardLevelView = "flat",
  rowTypeIds = [],
  cardTypeIds = [],
  onHover,
  onMouseMove
}: Readonly<GanttNodeSectionProps>) {

  const [interaction, setInteraction] = useState<ActiveInteraction | null>(null);
  const [optimisticChanges, setOptimisticChanges] = useState<Record<string, { leftOffset: number; widthOffset: number; rowOffset: number }>>({});

  interface PendingExtension {
    parentNodeId: string;
    parentTitle: string;
    childTitle: string;
    updatedParentStart: string;
    updatedParentEnd: string;
  }

  const [pendingExtension, setPendingExtension] = useState<PendingExtension | null>(null);

  const getDescendantNodeIds = useCallback((parentNodeId: string): string[] => {
    const list: string[] = [];
    const traverse = (id: string) => {
      nodes.forEach(n => {
        if (n.parentLinks?.some(pl => pl.parentNode?.id === id)) {
          if (!list.includes(n.id)) {
            list.push(n.id);
            traverse(n.id);
          }
        }
      });
    };
    traverse(parentNodeId);
    return list;
  }, [nodes]);

  // Group nodes by parent-child relationships
  const { parentNodes, childNodes, childByParentId, unparentedChildren } = useMemo(() => {
    if (!boardLevelView || boardLevelView === "flat") {
      const sortedNodes = [...nodes].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.id || 0).getTime();
        const timeB = new Date(b.createdAt || b.id || 0).getTime();
        return timeA - timeB;
      });
      return {
        parentNodes: [],
        childNodes: [],
        childByParentId: {} as Record<string, Node[]>,
        unparentedChildren: sortedNodes
      };
    }

    const parents = nodes.filter(n => rowTypeIds.includes(n.nodeTypeId));
    const children = nodes.filter(n => cardTypeIds.includes(n.nodeTypeId));

    const mapping: Record<string, Node[]> = {};
    parents.forEach(p => {
      const parentChildren = children.filter(c => 
        c.parentLinks?.some(pl => pl.parentNode?.id === p.id)
      );
      mapping[p.id] = parentChildren.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.id || 0).getTime();
        const timeB = new Date(b.createdAt || b.id || 0).getTime();
        return timeA - timeB;
      });
    });

    const parentIdsSet = new Set(parents.map(p => p.id));
    const childIdsSet = new Set(children.map(c => c.id));
    const unparented = nodes.filter(n => 
      !parentIdsSet.has(n.id) && 
      (!childIdsSet.has(n.id) || !n.parentLinks?.some(pl => parentIdsSet.has(pl.parentNode?.id)))
    );

    const sortedUnparented = [...unparented].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.id || 0).getTime();
      const timeB = new Date(b.createdAt || b.id || 0).getTime();
      return timeA - timeB;
    });

    return {
      parentNodes: parents,
      childNodes: children,
      childByParentId: mapping,
      unparentedChildren: sortedUnparented
    };
  }, [nodes, boardLevelView, rowTypeIds, cardTypeIds]);

  // Layout calculations: lane packing for parents, global rows mapping, and box specifications
  const layout = useMemo(() => {
    if (!boardLevelView || boardLevelView === "flat" || parentNodes.length === 0) {
      const nodeRows: Record<string, { row: number; isChild: boolean }> = {};
      nodes.forEach((n, idx) => {
        nodeRows[n.id] = { row: idx, isChild: false };
      });
      return {
        globalRowsCount: nodes.length,
        parentBoxes: [],
        nodeLayouts: nodeRows
      };
    }

    const getDates = (node: Node) => {
      const start = new Date(node.startDate || node.createdAt || Date.now());
      const end = node.endDate ? new Date(node.endDate) : new Date(start);
      return { start, end };
    };

    // Sort parent nodes by createdAt to maintain stable order and prevent jumping/swapping during date edits
    const sortedParents = [...parentNodes].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    // Pack parents into lanes
    const lanes: Node[][] = [];
    sortedParents.forEach(parent => {
      const { start: pStart, end: pEnd } = getDates(parent);
      
      let assignedLaneIndex = -1;
      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        const hasOverlap = lane.some(otherParent => {
          const { start: oStart, end: oEnd } = getDates(otherParent);
          return pStart < oEnd && pEnd > oStart;
        });
        if (!hasOverlap) {
          assignedLaneIndex = i;
          break;
        }
      }
      
      if (assignedLaneIndex === -1) {
        lanes.push([parent]);
      } else {
        lanes[assignedLaneIndex].push(parent);
      }
    });

    const parentBoxes: { id: string; parent: Node; startRow: number; rowCount: number }[] = [];
    const nodeLayouts: Record<string, { row: number; isChild: boolean; parentBoxId?: string }> = {};
    let currentGlobalRow = 0;

    // Map each parent and its children to global rows
    lanes.forEach(lane => {
      let maxLaneRows = 1;
      lane.forEach(parent => {
        const children = childByParentId[parent.id] || [];
        maxLaneRows = Math.max(maxLaneRows, 1 + children.length);
      });

      lane.forEach(parent => {
        const children = childByParentId[parent.id] || [];
        
        nodeLayouts[parent.id] = {
          row: currentGlobalRow,
          isChild: false
        };

        children.forEach((child, childIdx) => {
          nodeLayouts[child.id] = {
            row: currentGlobalRow + 1 + childIdx,
            isChild: true,
            parentBoxId: parent.id
          };
        });

        parentBoxes.push({
          id: parent.id,
          parent,
          startRow: currentGlobalRow,
          rowCount: 1 + children.length
        });
      });

      currentGlobalRow += maxLaneRows;
    });

    // Assign unparented children to subsequent rows
    unparentedChildren.forEach(child => {
      nodeLayouts[child.id] = {
        row: currentGlobalRow,
        isChild: true
      };
      currentGlobalRow++;
    });

    return {
      globalRowsCount: currentGlobalRow,
      parentBoxes,
      nodeLayouts
    };
  }, [boardLevelView, parentNodes, childByParentId, unparentedChildren, nodes]);

  // Handle Drag / Resize Start
  const handleMouseDown = useCallback((
    nodeId: string, 
    startCol: number, 
    endCol: number | null, 
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    let type: "move" | "resize-left" | "resize-right" = "move";

    if (target.className.includes("handle-left")) {
      type = "resize-left";
    } else if (target.className.includes("handle-right")) {
      type = "resize-right";
    }

    let defaultLeft = 0;
    let defaultWidth = 0;
    if (viewScale === "days") {
      defaultLeft = startCol * 40;
      defaultWidth = (endCol !== null) ? Math.max(40, (endCol - startCol + 1) * 40) : 120;
    } else {
      defaultLeft = (startCol / 7) * 140;
      defaultWidth = (endCol !== null) ? Math.max(20, ((endCol - startCol + 1) / 7) * 140) : 60;
    }

    setInteraction({
      nodeId,
      type,
      startX: e.clientX,
      startY: e.clientY,
      originalLeft: defaultLeft,
      originalWidth: defaultWidth,
      originalRow: 0
    });
  }, [viewScale]);

  // Drag / Resize Effect
  useEffect(() => {
    if (!interaction) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - interaction.startX;
      
      let deltaDays = 0;
      let deltaPixels = 0;

      if (viewScale === "days") {
        deltaDays = Math.round(deltaX / 40);
        deltaPixels = deltaDays * 40;
      } else {
        deltaDays = Math.round(deltaX / 20);
        deltaPixels = deltaDays * 20;
      }

      const descendants = getDescendantNodeIds(interaction.nodeId);

      setOptimisticChanges(prev => {
        const next = { ...prev };
        if (interaction.type === "move") {
          next[interaction.nodeId] = {
            leftOffset: deltaPixels,
            widthOffset: 0,
            rowOffset: 0
          };
          descendants.forEach(descId => {
            next[descId] = {
              leftOffset: deltaPixels,
              widthOffset: 0,
              rowOffset: 0
            };
          });
        } else if (interaction.type === "resize-left") {
          const maxLeftOffset = interaction.originalWidth - (viewScale === "days" ? 40 : 20);
          const leftOffset = Math.min(deltaPixels, maxLeftOffset);
          next[interaction.nodeId] = {
            leftOffset,
            widthOffset: -leftOffset,
            rowOffset: 0
          };
        } else if (interaction.type === "resize-right") {
          const minWidthOffset = (viewScale === "days" ? 40 : 20) - interaction.originalWidth;
          const widthOffset = Math.max(deltaPixels, minWidthOffset);
          next[interaction.nodeId] = {
            leftOffset: 0,
            widthOffset,
            rowOffset: 0
          };
        }
        return next;
      });
    };

    const handleMouseUp = async () => {
      const currentOpt = optimisticChanges[interaction.nodeId];
      let deltaDays = 0;
      let deltaWidthDays = 0;

      if (currentOpt) {
        if (viewScale === "days") {
          deltaDays = Math.round(currentOpt.leftOffset / 40);
          deltaWidthDays = Math.round(currentOpt.widthOffset / 40);
        } else {
          deltaDays = Math.round(currentOpt.leftOffset / 20);
          deltaWidthDays = Math.round(currentOpt.widthOffset / 20);
        }
      }

      const descendants = getDescendantNodeIds(interaction.nodeId);

      setInteraction(null);

      if (deltaDays !== 0 || deltaWidthDays !== 0) {
        const targetNode = nodes.find(n => n.id === interaction.nodeId);
        if (targetNode) {
          const startStr = targetNode.startDate || targetNode.createdAt;
          const originalStart = new Date(startStr);
          const originalEnd = targetNode.endDate ? new Date(targetNode.endDate) : new Date(originalStart);

          const newStart = new Date(originalStart);
          newStart.setDate(newStart.getDate() + deltaDays);

          const newEnd = new Date(originalEnd);
          if (interaction.type === "move") {
            newEnd.setDate(newEnd.getDate() + deltaDays);
          } else if (interaction.type === "resize-right") {
            newEnd.setDate(newEnd.getDate() + deltaWidthDays);
          } else if (interaction.type === "resize-left") {
            newEnd.setDate(newEnd.getDate() + deltaDays + deltaWidthDays);
          }

          try {
            await updateNode(projectId, targetNode.id, {
              startDate: newStart.toISOString(),
              endDate: newEnd.toISOString()
            });

            if (interaction.type === "move" && deltaDays !== 0) {
              if (descendants.length > 0) {
                await Promise.all(
                  descendants.map(async (descId) => {
                    const descNode = nodes.find(n => n.id === descId);
                    if (descNode) {
                      const descStartStr = descNode.startDate || descNode.createdAt;
                      const descOriginalStart = new Date(descStartStr);
                      const descOriginalEnd = descNode.endDate ? new Date(descNode.endDate) : new Date(descOriginalStart);

                      const descNewStart = new Date(descOriginalStart);
                      descNewStart.setDate(descNewStart.getDate() + deltaDays);

                      const descNewEnd = new Date(descOriginalEnd);
                      descNewEnd.setDate(descNewEnd.getDate() + deltaDays);

                      await updateNode(projectId, descNode.id, {
                        startDate: descNewStart.toISOString(),
                        endDate: descNewEnd.toISOString()
                      });
                    }
                  })
                );
              }
            }

            const parentNode = targetNode.parentLinks?.[0]?.parentNode;
            if (parentNode) {
              const parentStartVal = parentNode.startDate || parentNode.createdAt;
              const parentEndVal = parentNode.endDate || parentStartVal;
              const parentStart = new Date(parentStartVal);
              const parentEnd = new Date(parentEndVal);

              if (newStart < parentStart || newEnd > parentEnd) {
                  const updatedParentStart = newStart < parentStart ? newStart : parentStart;
                  const updatedParentEnd = newEnd > parentEnd ? newEnd : parentEnd;

                  setPendingExtension({
                    parentNodeId: parentNode.id,
                    parentTitle: parentNode.title,
                    childTitle: targetNode.title,
                    updatedParentStart: updatedParentStart.toISOString(),
                    updatedParentEnd: updatedParentEnd.toISOString()
                  });
              }
            }
          } catch (err) {
            console.error("Error updating node timeline dates:", err);
          } finally {
            setOptimisticChanges(prev => {
              const next = { ...prev };
              delete next[interaction.nodeId];
              descendants.forEach(descId => {
                delete next[descId];
              });
              return next;
            });
          }
        }
      } else {
        setOptimisticChanges(prev => {
          const next = { ...prev };
          delete next[interaction.nodeId];
          descendants.forEach(descId => {
            delete next[descId];
          });
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
  }, [interaction, optimisticChanges, nodes, projectId, layout, getDescendantNodeIds, viewScale]);

  // Helper to render a timeline bar
  const renderBar = (node: Node) => {
    const layoutInfo = layout.nodeLayouts[node.id];
    if (!layoutInfo) return null;

    const isChild = layoutInfo.isChild;
    const globalRow = layoutInfo.row;

    const startCol = getDayOffset(node.startDate || node.createdAt);
    const endCol = getDayOffset(node.endDate);
    const nodeColor = node.type?.color || "var(--primary)";

    if (startCol === null) return null;

    let left = 0;
    let width = 0;
    if (viewScale === "days") {
      left = startCol * 40;
      const daysVal = endCol !== null ? Math.max(1, endCol - startCol + 1) : 3;
      width = daysVal * 40;
    } else {
      left = (startCol / 7) * 140;
      const daysVal = endCol !== null ? Math.max(1, endCol - startCol + 1) : 3;
      width = (daysVal / 7) * 140;
    }

    const changes = optimisticChanges[node.id];
    const leftOffset = changes?.leftOffset ?? 0;
    const widthOffset = changes?.widthOffset ?? 0;

    const finalLeft = left + leftOffset;
    const finalWidth = width + widthOffset;

    const top = globalRow * 48 + (isChild ? 14 : 10);
    const isDragging = interaction?.nodeId === node.id;
    const barClass = `gantt-node-bar ${isChild ? "gantt-node-bar-child" : "gantt-node-bar-parent"} ${isDragging ? "is-dragging" : ""}`;

    return (
      <div
        key={`${node.id}-${isChild ? 'child' : 'parent'}`}
        className={barClass}
        style={{
          "--left": `${finalLeft + 4}px`,
          "--width": `${finalWidth - 8}px`,
          "--color": nodeColor,
          top: `${top}px`
        } as React.CSSProperties}
        onMouseDown={(e) => handleMouseDown(node.id, startCol, endCol, e)}
        onMouseEnter={(e) => onHover(e, {
          title: node.title,
          subtitle: `${new Date(node.startDate || node.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} – ${node.endDate ? new Date(node.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No end date'}`,
          badge: node.type?.name,
          badgeColor: nodeColor
        })}
        onMouseMove={onMouseMove}
        onMouseLeave={() => onHover(null, null)}
      >
        <div className="gantt-node-bar-handle-left" />
        <span className="truncate">{isChild ? `↳ ${node.title}` : node.title}</span>
        <div className="gantt-node-bar-handle-right" />
      </div>
    );
  };

  const renderGridBg = () => {
    const items = viewScale === "days" ? days : weeks;
    const colWidth = viewScale === "days" ? 40 : 140;
    return (
      <div className="gantt-bg-grid">
        {items.map((item) => {
          const isWeekend = viewScale === "days" && (item.getDay() === 0 || item.getDay() === 6);
          return (
            <div 
              key={item.toISOString()} 
              className={`gantt-grid-cell ${isWeekend ? 'weekend' : ''}`}
              style={{ width: `${colWidth}px` }}
            />
          );
        })}
      </div>
    );
  };

  const rowHeight = 48;
  const totalRows = layout.globalRowsCount;

  return (
    <div className="relative w-full" style={{ height: `${totalRows * rowHeight}px` }}>
      {/* 1. Background Grid Rows */}
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        {Array.from({ length: totalRows }).map((_, idx) => (
          <div key={idx} className="gantt-node-row flex-1 relative border-b border-[rgba(172,179,183,0.05)]">
            {renderGridBg()}
          </div>
        ))}
      </div>

      {/* 2. Background Parent Boxes */}
      {layout.parentBoxes.map((box) => {
        const parent = box.parent;
        const startCol = getDayOffset(parent.startDate || parent.createdAt);
        const endCol = getDayOffset(parent.endDate);
        if (startCol === null) return null;

        let left = 0;
        let width = 0;
        if (viewScale === "days") {
          left = startCol * 40;
          const daysVal = endCol !== null ? Math.max(1, endCol - startCol + 1) : 3;
          width = daysVal * 40;
        } else {
          left = (startCol / 7) * 140;
          const daysVal = endCol !== null ? Math.max(1, endCol - startCol + 1) : 3;
          width = (daysVal / 7) * 140;
        }

        const changes = optimisticChanges[parent.id];
        const leftOffset = changes?.leftOffset ?? 0;
        const widthOffset = changes?.widthOffset ?? 0;

        const finalLeft = left + leftOffset;
        const finalWidth = width + widthOffset;

        const top = box.startRow * rowHeight + 4;
        const height = box.rowCount * rowHeight - 8;
        const parentColor = parent.type?.color || "var(--primary)";

        return (
          <div
            key={`box-${box.id}`}
            className="gantt-parent-box cursor-help"
            style={{
              left: `${finalLeft}px`,
              width: `${finalWidth}px`,
              top: `${top}px`,
              height: `${height}px`,
              borderColor: parentColor,
              backgroundColor: `color-mix(in srgb, ${parentColor} 4%, transparent)`,
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => onHover(e, {
              title: `${parent.title} (Parent Container)`,
              subtitle: `${new Date(parent.startDate || parent.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })} – ${parent.endDate ? new Date(parent.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No end date'}`,
              badge: parent.type?.name,
              badgeColor: parentColor
            })}
            onMouseMove={onMouseMove}
            onMouseLeave={() => onHover(null, null)}
          />
        );
      })}

      {/* 3. Node Bars */}
      {nodes.map((node) => renderBar(node))}

      {/* 4. Parent Extension Modal */}
      {pendingExtension && (
        <Modal
          isOpen={!!pendingExtension}
          onClose={() => setPendingExtension(null)}
          title="Extend Parent Timeline?"
          subtitle="Timeline Alignment Warning"
          maxWidth="460px"
          footer={
            <div className="flex justify-end gap-sm w-full">
              <Button 
                variant="ghost" 
                onClick={() => setPendingExtension(null)}
              >
                Keep Parent
              </Button>
              <Button 
                variant="primary" 
                onClick={async () => {
                  try {
                    await updateNode(projectId, pendingExtension.parentNodeId, {
                      startDate: pendingExtension.updatedParentStart,
                      endDate: pendingExtension.updatedParentEnd
                    });
                  } catch (err) {
                    console.error("Failed to extend parent node:", err);
                  } finally {
                    setPendingExtension(null);
                  }
                }}
              >
                Yes, Extend Parent
              </Button>
            </div>
          }
        >
          <div className="flex flex-col gap-md py-md">
            <div className="flex items-start gap-md">
              <div className="p-sm rounded-lg bg-[rgba(235,87,87,0.1)] text-error shrink-0 mt-xs">
                <AlertCircle size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold mb-xs">Timeline conflict detected</p>
                <p className="text-xs text-secondary leading-relaxed">
                  The item <strong className="text-on-surface">'{pendingExtension.childTitle}'</strong> now extends outside the timeline of its parent <strong className="text-on-surface">'{pendingExtension.parentTitle}'</strong>.
                </p>
              </div>
            </div>
            <div className="mt-sm p-md rounded-lg bg-surface-container-high border border-outline-variant flex flex-col gap-sm">
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Proposed Parent Start:</span>
                <span className="font-mono font-medium">{new Date(pendingExtension.updatedParentStart).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-secondary">Proposed Parent End:</span>
                <span className="font-mono font-medium">{new Date(pendingExtension.updatedParentEnd).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
