import { Sprint } from "@/lib/types";

interface GanttSprintSectionProps {
  sprints: Sprint[];
  currentSprintId: string | null;
  getDayOffset: (date: string | Date | null | undefined) => number | null;
  viewScale: "days" | "weeks";
  colWidth: number;
}

export function GanttSprintSection({ 
  sprints, 
  currentSprintId, 
  getDayOffset,
  viewScale,
  colWidth
}: Readonly<GanttSprintSectionProps>) {
  return (
    <div className="gantt-sprints-row">
       <div className="flex-1 relative">
          {sprints.map((sprint) => {
              const start = getDayOffset(sprint.startDate);
              const end = getDayOffset(sprint.endDate);
              if (start === null || end === null) return null;
              
              let left = 0;
              let width = 0;
              if (viewScale === "days") {
                left = start * 40;
                width = (end - start + 1) * 40;
              } else {
                left = (start / 7) * 140;
                width = ((end - start + 1) / 7) * 140;
              }

              return (
                  <div key={sprint.id} className={`gantt-sprint-bar ${sprint.id === currentSprintId ? 'active' : ''}`} style={{ '--left': `${left}px`, '--width': `${width}px` } as React.CSSProperties}>
                      {sprint.name.toUpperCase()}
                  </div>
              );
          })}
       </div>
    </div>
  );
}
