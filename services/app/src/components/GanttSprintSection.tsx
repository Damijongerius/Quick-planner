"use client";

import React from 'react';

export function GanttSprintSection({ sprints, currentSprintId, getDayOffset }: any) {
  return (
    <div className="gantt-sprints-row">
       <div className="gantt-label-col text-meta text-primary">STRATEGIC CYCLES</div>
       <div className="flex-1 relative">
          {sprints.map((sprint: any) => {
              const start = getDayOffset(sprint.startDate);
              const end = getDayOffset(sprint.endDate);
              if (start === null || end === null) return null;
              
              const width = (end - start + 1) * 40;
              return (
                  <div key={sprint.id} className={`gantt-sprint-bar ${sprint.id === currentSprintId ? 'active' : ''}`} style={{ '--left': `${start * 40}px`, '--width': `${width}px` } as any}>
                      {sprint.name.toUpperCase()}
                  </div>
              );
          })}
       </div>
    </div>
  );
}
