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
  // 1. Determine Total Date Range based on ALL sprints for this project
  const { startDate, endDate, days } = useMemo(() => {
    if (sprints.length === 0) {
        const d = new Date();
        d.setHours(0,0,0,0);
        const end = new Date(d);
        end.setDate(end.getDate() + 14);
        return { startDate: d, endDate: end, days: generateDays(d, end) };
    }

    const sorted = [...sprints].filter(s => s.startDate).sort((a, b) => 
        new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime()
    );

    if (sorted.length === 0) {
        const d = new Date();
        const end = new Date(d);
        end.setDate(end.getDate() + 14);
        return { startDate: d, endDate: end, days: generateDays(d, end) };
    }

    const start = new Date(sorted[0].startDate!);
    start.setHours(0,0,0,0);
    
    const endDates = sprints.filter(s => s.endDate).map(s => new Date(s.endDate!).getTime());
    let end = endDates.length > 0 ? new Date(Math.max(...endDates)) : new Date(start);
    if (end.getTime() <= start.getTime()) {
        end = new Date(start);
        end.setDate(end.getDate() + 14);
    }
    
    return { startDate: start, endDate: end, days: generateDays(start, end) };
  }, [sprints]);

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
    <div className="card-sanctuary" style={{ padding: 0, overflow: 'hidden', backgroundColor: 'var(--surface-container-lowest)', border: '1px solid var(--outline-variant)' }}>
      {/* Chart Header */}
      <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ padding: '8px', backgroundColor: 'rgba(70, 86, 184, 0.1)', color: 'var(--primary)', borderRadius: '8px' }}>
                <Milestone size={20} />
            </div>
            <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Project Strategic Timeline</h3>
                <p className="text-meta" style={{ fontSize: '9px', opacity: 0.6 }}>
                    {startDate.toLocaleDateString()} — {endDate.toLocaleDateString()} • {sprints.length} Cycles Defined
                </p>
            </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <div style={{ minWidth: `${days.length * 40 + 280}px` }}>
          
          <div style={{ display: 'flex', backgroundColor: 'var(--surface-container-low)', borderBottom: '1px solid var(--outline-variant)' }}>
            <div style={{ width: '280px', padding: '12px 32px', fontSize: '10px', fontWeight: 800, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.1em', borderRight: '1px solid var(--outline-variant)' }}>
                Strategic Phases
            </div>
            <div style={{ flex: 1, display: 'flex' }}>
                {days.map((day, i) => {
                    const isFirstOfMonth = day.getDate() === 1;
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                    return (
                        <div key={i} style={{ 
                            width: '40px', 
                            textAlign: 'center', 
                            padding: '8px 0', 
                            fontSize: '9px', 
                            fontWeight: 700,
                            color: isWeekend ? 'rgba(89, 96, 100, 0.3)' : 'var(--on-surface-variant)',
                            borderRight: '1px solid rgba(172, 179, 183, 0.1)',
                            position: 'relative'
                        }}>
                            {isFirstOfMonth && (
                                <div style={{ position: 'absolute', top: '-18px', left: 0, whiteSpace: 'nowrap', color: 'var(--primary)', fontSize: '8px', fontWeight: 800 }}>
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
          <div style={{ display: 'flex', borderBottom: '2px solid var(--outline-variant)', height: '48px', backgroundColor: 'var(--surface-container-low)' }}>
             <div style={{ width: '280px', display: 'flex', alignItems: 'center', padding: '0 32px', borderRight: '1px solid var(--outline-variant)', fontSize: '10px', fontWeight: 800, color: 'var(--primary)' }}>
                STRATEGIC CYCLES
             </div>
             <div style={{ flex: 1, position: 'relative' }}>
                {sprints.map(sprint => {
                    const start = getDayOffset(sprint.startDate);
                    const end = getDayOffset(sprint.endDate);
                    if (start === null || end === null) return null;
                    
                    const width = (end - start + 1) * 40;
                    const isActive = sprint.id === currentSprintId;

                    return (
                        <div 
                            key={sprint.id}
                            style={{ 
                                position: 'absolute',
                                left: `${start * 40}px`,
                                width: `${width}px`,
                                height: '32px',
                                top: '8px',
                                backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-container-highest)',
                                color: isActive ? 'white' : 'var(--on-surface-variant)',
                                borderRadius: '6px',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '0 12px',
                                fontSize: '10px',
                                fontWeight: 800,
                                boxShadow: isActive ? 'var(--primary-shadow)' : 'none',
                                zIndex: 2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden'
                            }}
                        >
                            {sprint.name.toUpperCase()}
                        </div>
                    );
                })}
             </div>
          </div>

          {/* Nodes Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {nodes.map((node) => {
              const startCol = getDayOffset(node.startDate || node.createdAt);
              const endCol = getDayOffset(node.endDate);
              const nodeColor = node.type?.color || 'var(--primary)';
              
              const width = (startCol !== null && endCol !== null) ? (endCol - startCol + 1) * 40 : 120;

              return (
                <div key={node.id} style={{ display: 'flex', borderBottom: '1px solid rgba(172, 179, 183, 0.1)', height: '48px' }}>
                  <div style={{ width: '280px', display: 'flex', alignItems: 'center', gap: '12px', padding: '0 32px', borderRight: '1px solid var(--outline-variant)', backgroundColor: 'var(--surface-container-lowest)' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: nodeColor }} />
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--on-surface)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {node.title}
                    </span>
                  </div>
                  
                  <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                    {/* Background Grid */}
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', pointerEvents: 'none' }}>
                        {days.map((day, i) => (
                            <div key={i} style={{ 
                                width: '40px', 
                                height: '100%', 
                                borderRight: '1px solid rgba(172, 179, 183, 0.05)',
                                backgroundColor: (day.getDay() === 0 || day.getDay() === 6) ? 'rgba(0,0,0,0.01)' : 'transparent'
                            }} />
                        ))}
                    </div>

                    {startCol !== null && (
                      <div 
                        style={{ 
                          position: 'absolute', 
                          left: `${startCol * 40 + 4}px`, 
                          width: `${width}px`, 
                          height: '24px', 
                          top: '12px',
                          backgroundColor: `${nodeColor}10`,
                          border: `1px solid ${nodeColor}40`,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 8px',
                          fontSize: '9px',
                          color: nodeColor,
                          fontWeight: 700,
                          zIndex: 1,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden'
                        }}
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
