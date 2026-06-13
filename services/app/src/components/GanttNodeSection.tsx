"use client";

import React from "react";
import { Node } from "@/lib/types";
import { useGanttLayout } from "./GanttLayoutUtils";
import { useGanttInteraction } from "./useGanttInteraction";
import { GanttParentExtensionModal } from "./GanttParentExtensionModal";

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

  const { getDescendantNodeIds, layout } = useGanttLayout(nodes, boardLevelView, rowTypeIds, cardTypeIds);
  const { interaction, optimisticChanges, pendingExtension, setPendingExtension, handleMouseDown } = useGanttInteraction(projectId, nodes, viewScale, getDescendantNodeIds);

  const renderBar = (node: Node) => {
    const layoutInfo = layout.nodeLayouts[node.id];
    if (!layoutInfo) return null;

    const isChild = layoutInfo.isChild;
    const globalRow = layoutInfo.row;
    const startCol = getDayOffset(node.startDate || node.createdAt);
    const endCol = getDayOffset(node.endDate);
    const nodeColor = node.type?.color || "var(--primary)";

    if (startCol === null) return null;

    let left = 0, width = 0;
    if (viewScale === "days") {
      left = startCol * 40;
      width = (endCol !== null ? Math.max(1, endCol - startCol + 1) : 3) * 40;
    } else {
      left = (startCol / 7) * 140;
      width = ((endCol !== null ? Math.max(1, endCol - startCol + 1) : 3) / 7) * 140;
    }

    const changes = optimisticChanges[node.id];
    const finalLeft = left + (changes?.leftOffset ?? 0);
    const finalWidth = width + (changes?.widthOffset ?? 0);
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
          return <div key={item.toISOString()} className={`gantt-grid-cell ${isWeekend ? 'weekend' : ''}`} style={{ width: `${colWidth}px` }} />;
        })}
      </div>
    );
  };

  const rowHeight = 48;
  const totalRows = layout.globalRowsCount;

  return (
    <div className="relative w-full" style={{ height: `${totalRows * rowHeight}px` }}>
      <div className="absolute inset-0 pointer-events-none flex flex-col">
        {Array.from({ length: totalRows }).map((_, idx) => (
          <div key={idx} className="gantt-node-row flex-1 relative border-b border-[rgba(172,179,183,0.05)]">
            {renderGridBg()}
          </div>
        ))}
      </div>

      {layout.parentBoxes.map((box) => {
        const parent = box.parent;
        const startCol = getDayOffset(parent.startDate || parent.createdAt);
        const endCol = getDayOffset(parent.endDate);
        if (startCol === null) return null;

        let left = 0, width = 0;
        if (viewScale === "days") {
          left = startCol * 40;
          width = (endCol !== null ? Math.max(1, endCol - startCol + 1) : 3) * 40;
        } else {
          left = (startCol / 7) * 140;
          width = ((endCol !== null ? Math.max(1, endCol - startCol + 1) : 3) / 7) * 140;
        }

        const changes = optimisticChanges[parent.id];
        const finalLeft = left + (changes?.leftOffset ?? 0);
        const finalWidth = width + (changes?.widthOffset ?? 0);
        const top = box.startRow * rowHeight + 4;
        const height = box.rowCount * rowHeight - 8;
        const parentColor = parent.type?.color || "var(--primary)";

        return (
          <div
            key={`box-${box.id}`}
            className="gantt-parent-box cursor-help"
            style={{ left: `${finalLeft}px`, width: `${finalWidth}px`, top: `${top}px`, height: `${height}px`, borderColor: parentColor, backgroundColor: `color-mix(in srgb, ${parentColor} 4%, transparent)`, pointerEvents: 'auto' }}
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

      {nodes.map((node) => renderBar(node))}

      {pendingExtension && (
        <GanttParentExtensionModal projectId={projectId} pendingExtension={pendingExtension} setPendingExtension={setPendingExtension} />
      )}
    </div>
  );
}
