"use client";

import React from 'react';

export function GanttNodeSection({ nodes, days, getDayOffset }: any) {
  return (
    <div className="flex flex-col">
      {nodes.map((node: any) => {
        const startCol = getDayOffset(node.startDate || node.createdAt);
        const endCol = getDayOffset(node.endDate);
        const nodeColor = node.type?.color || 'var(--primary)';
        const width = (startCol !== null && endCol !== null) ? (endCol - startCol + 1) * 40 : 120;

        return (
          <div key={node.id} className="gantt-node-row">
            <div className="gantt-label-col gantt-node-label-container">
              <div className="gantt-node-indicator" style={{ backgroundColor: nodeColor }} />
              <span className="gantt-node-title">{node.title}</span>
            </div>
            
            <div className="flex-1 relative h-full">
              <div className="gantt-bg-grid">
                  {days.map((day: any, i: number) => (
                      <div key={i} className={`gantt-grid-cell ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`} />
                  ))}
              </div>

              {startCol !== null && (
                <div className="gantt-node-bar" style={{ '--left': `${startCol * 40 + 4}px`, '--width': `${width}px`, '--color': nodeColor } as any}>
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
