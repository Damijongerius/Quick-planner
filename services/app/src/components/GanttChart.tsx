"use client";

import React, { useMemo } from "react";
import { Milestone } from "lucide-react";
import { GanttGridHeader } from "./GanttGridHeader";
import { GanttSprintSection } from "./GanttSprintSection";
import { GanttNodeSection } from "./GanttNodeSection";
import "./Gantt.css";

export function GanttChart({ nodes, sprints, currentSprintId }: any) {
  const { startDate, endDate, days } = useMemo(() => {
    const allDates: number[] = [];
    sprints.forEach((s: any) => { if (s.startDate) allDates.push(new Date(s.startDate).getTime()); if (s.endDate) allDates.push(new Date(s.endDate).getTime()); });
    nodes.forEach((n: any) => { if (n.startDate) allDates.push(new Date(n.startDate).getTime()); if (n.endDate) allDates.push(new Date(n.endDate).getTime()); });

    if (allDates.length === 0) {
        const d = new Date(); d.setHours(0,0,0,0); const end = new Date(d); end.setDate(end.getDate() + 14);
        return { startDate: d, endDate: end, days: generateDays(d, end) };
    }

    const minDate = new Date(Math.min(...allDates)); minDate.setHours(0,0,0,0); minDate.setDate(minDate.getDate() - 2);
    const maxDate = new Date(Math.max(...allDates)); maxDate.setHours(0,0,0,0); maxDate.setDate(maxDate.getDate() + 7);
    return { startDate: minDate, endDate: maxDate, days: generateDays(minDate, maxDate) };
  }, [sprints, nodes]);

  function generateDays(start: Date, end: Date) {
    const list = []; const curr = new Date(start); const stop = new Date(end);
    let count = 0; while (curr <= stop && count < 180) { list.push(new Date(curr)); curr.setDate(curr.getDate() + 1); count++; }
    return list;
  }

  const getDayOffset = (dateValue: any) => {
    if (!dateValue) return null;
    const d = new Date(dateValue); d.setHours(0,0,0,0);
    const diffDays = Math.floor((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (diffDays < 0 || diffDays >= days.length) ? null : diffDays;
  };

  return (
    <div className="card-sanctuary gantt-container">
      <header className="gantt-header">
        <div className="flex items-center gap-md">
            <div className="gantt-header-icon"><Milestone size={20} /></div>
            <div><h3 className="gantt-header-title">Project Strategic Timeline</h3><p className="text-meta gantt-header-subtitle">{startDate.toLocaleDateString()} — {endDate.toLocaleDateString()} • {sprints.length} Cycles Defined</p></div>
        </div>
      </header>

      <div className="gantt-scroll-area">
        <div className="gantt-content" style={{ '--gantt-min-width': `${days.length * 40 + 280}px` } as any}>
          <GanttGridHeader days={days} />
          <GanttSprintSection sprints={sprints} currentSprintId={currentSprintId} getDayOffset={getDayOffset} />
          <GanttNodeSection nodes={nodes} days={days} getDayOffset={getDayOffset} />
        </div>
      </div>
    </div>
  );
}
