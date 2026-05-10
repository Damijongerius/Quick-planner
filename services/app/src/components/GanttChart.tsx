"use client";

import { useMemo } from "react";
import { Calendar, ChevronRight, Clock, Milestone } from "lucide-react";

interface GanttChartProps {
  projectId: string;
  nodes: any[];
  sprints: any[];
  currentSprintId: string | null;
}

export function GanttChart({ projectId, nodes, sprints, currentSprintId }: GanttChartProps) {
  // 1. Determine Total Date Range based on ALL sprints AND nodes for this project
  const { startDate, endDate, days } = useMemo(() => {
    const allDates: number[] = [];
    
    // Collect from sprints
    sprints.forEach(s => {
        if (s.startDate) allDates.push(new Date(s.startDate).getTime());
        if (s.endDate) allDates.push(new Date(s.endDate).getTime());
    });

    // Collect from nodes
    nodes.forEach(n => {
        if (n.startDate) allDates.push(new Date(n.startDate).getTime());
        if (n.endDate) allDates.push(new Date(n.endDate).getTime());
    });

    if (allDates.length === 0) {
        const d = new Date();
        d.setHours(0,0,0,0);
        const end = new Date(d);
        end.setDate(end.getDate() + 14);
        return { startDate: d, endDate: end, days: generateDays(d, end) };
    }

    const minDate = new Date(Math.min(...allDates));
    minDate.setHours(0,0,0,0);
    
    // Buffer the start by 2 days
    minDate.setDate(minDate.getDate() - 2);

    const maxDate = new Date(Math.max(...allDates));
    maxDate.setHours(0,0,0,0);
    
    // Buffer the end by 7 days
    maxDate.setDate(maxDate.getDate() + 7);

    return { startDate: minDate, endDate: maxDate, days: generateDays(minDate, maxDate) };
  }, [sprints, nodes]);

  function generateDays(start: Date, end: Date) {
    const list = [];
    const curr = new Date(start);
    const stop = new Date(end);
    let count = 0;
    while (curr <= stop && count < 180) {
      list.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
      count++;
    }
    return list;
  }

  const getDayOffset = (dateValue: any) => {
    if (!dateValue) return null;
    const d = new Date(dateValue);
    d.setHours(0,0,0,0);
    const diff = d.getTime() - startDate.getTime();
    const diffDays = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (diffDays < 0 || diffDays >= days.length) return null;
    return diffDays;
  };

  return (
    <div className="card-sanctuary gantt-container">
      {/* Chart Header */}
      <header className="gantt-header">
        <div className="flex items-center gap-md">
            <div className="gantt-header-icon">
                <Milestone size={20} />
            </div>
            <div>
                <h3 className="gantt-header-title">Project Strategic Timeline</h3>
                <p className="text-meta gantt-header-subtitle">
                    {startDate.toLocaleDateString()} — {endDate.toLocaleDateString()} • {sprints.length} Cycles Defined
                </p>
            </div>
        </div>
      </header>

      <div className="gantt-scroll-area">
        <div className="gantt-content" style={{ '--gantt-min-width': `${days.length * 40 + 280}px` } as any}>
          
          <div className="gantt-grid-header">
            <div className="gantt-label-col text-meta">
                Strategic Phases
            </div>
            <div className="flex flex-1">
                {days.map((day, i) => {
                    const isFirstOfMonth = day.getDate() === 1;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                        <div key={i} className={`gantt-day-col ${isWeekend ? 'weekend' : ''}`}>
                            {isFirstOfMonth && (
                                <div className="gantt-month-label">
                                    {day.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                                </div>
                            )}
                            {day.getDate()}
                        </div>
                    );
                })}
            </div>
          </div>

          {/* Sprints Row */}
          <div className="gantt-sprints-row">
             <div className="gantt-label-col text-meta text-primary">
                STRATEGIC CYCLES
             </div>
             <div className="flex-1 relative">
                {sprints.map(sprint => {
                    const start = getDayOffset(sprint.startDate);
                    const end = getDayOffset(sprint.endDate);
                    if (start === null || end === null) return null;
                    
                    const width = (end - start + 1) * 40;
                    const isActive = sprint.id === currentSprintId;

                    return (
                        <div 
                            key={sprint.id}
                            className={`gantt-sprint-bar ${isActive ? 'active' : ''}`}
                            style={{ 
                                '--left': `${start * 40}px`,
                                '--width': `${width}px`
                            } as any}
                        >
                            {sprint.name.toUpperCase()}
                        </div>
                    );
                })}
             </div>
          </div>

          {/* Nodes Rows */}
          <div className="flex flex-col">
            {nodes.map((node) => {
              const startCol = getDayOffset(node.startDate || node.createdAt);
              const endCol = getDayOffset(node.endDate);
              const nodeColor = node.type?.color || 'var(--primary)';
              
              const width = (startCol !== null && endCol !== null) ? (endCol - startCol + 1) * 40 : 120;

              return (
                <div key={node.id} className="gantt-node-row">
                  <div className="gantt-label-col gantt-node-label-container">
                    <div className="gantt-node-indicator" style={{ backgroundColor: nodeColor }} />
                    <span className="gantt-node-title">
                        {node.title}
                    </span>
                  </div>
                  
                  <div className="flex-1 relative h-full">
                    {/* Background Grid */}
                    <div className="gantt-bg-grid">
                        {days.map((day, i) => (
                            <div key={i} className={`gantt-grid-cell ${day.getDay() === 0 || day.getDay() === 6 ? 'weekend' : ''}`} />
                        ))}
                    </div>

                    {startCol !== null && (
                      <div 
                        className="gantt-node-bar"
                        style={{ 
                          '--left': `${startCol * 40 + 4}px`, 
                          '--width': `${width}px`,
                          '--color': nodeColor
                        } as any}
                      >
                        {node.status}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
