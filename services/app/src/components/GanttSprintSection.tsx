import { Sprint } from "@/lib/types";

interface GanttSprintSectionProps {
  sprints: Sprint[];
  currentSprintId: string | null;
  getDayOffset: (date: string | Date | null | undefined) => number | null;
}

export function GanttSprintSection({ sprints, currentSprintId, getDayOffset }: Readonly<GanttSprintSectionProps>) {
  return (
    <div className="gantt-sprints-row">
       <div className="gantt-label-col text-meta text-primary">STRATEGIC CYCLES</div>
       <div className="flex-1 relative">
          {sprints.map((sprint) => {
              const start = getDayOffset(sprint.startDate);
              const end = getDayOffset(sprint.endDate);
              if (start === null || end === null) return null;
              
              const width = (end - start + 1) * 40;
              return (
                  <div key={sprint.id} className={`gantt-sprint-bar ${sprint.id === currentSprintId ? 'active' : ''}`} style={{ '--left': `${start * 40}px`, '--width': `${width}px` } as React.CSSProperties}>
                      {sprint.name.toUpperCase()}
                  </div>
              );
          })}
       </div>
    </div>
  );
}
