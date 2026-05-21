import { Node } from "@/lib/types";

interface GanttNodeSectionProps {
  nodes: Node[];
  days: Date[];
  getDayOffset: (date: string | Date | null | undefined) => number | null;
}

export function GanttNodeSection({ nodes, days, getDayOffset }: Readonly<GanttNodeSectionProps>) {
  return (
    <div className="flex flex-col">
      {nodes.map((node) => {
        const startCol = getDayOffset(node.startDate || node.createdAt);
        const endCol = getDayOffset(node.endDate);
        const nodeColor = node.type?.color || 'var(--primary)';
        const width = (startCol !== null && endCol !== null) ? Math.max(40, (endCol - startCol + 1) * 40) : 120;

        return (
          <div key={node.id} className="gantt-node-row">
            <div className="gantt-label-col gantt-node-label-container">
              <div className="gantt-node-indicator" style={{ backgroundColor: nodeColor }} />
              <span className="gantt-node-title">{node.title}</span>
            </div>
            
            <div className="flex-1 relative h-full">
              <div className="gantt-bg-grid">
                  {days.map((day) => (
                      <div key={day.toISOString()} className={`gantt-grid-cell ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`} />
                  ))}
              </div>

              {startCol !== null && (
                <div className="gantt-node-bar" style={{ '--left': `${startCol * 40 + 4}px`, '--width': `${width}px`, '--color': nodeColor } as React.CSSProperties}>
                  {node.status}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
