import { useMemo } from "react";
import { Node, Sprint } from "@/lib/types";
import { getStartOfWeek, getEndOfWeek, generateDays, generateWeeks } from "./GanttDateUtils";

export function useGanttTimeline(nodes: Node[], sprints: Sprint[]) {
  const { startDate, endDate, days, weeks } = useMemo(() => {
    const allDates: number[] = [];
    allDates.push(new Date().getTime());

    sprints.forEach((s) => { 
      if (s.startDate) allDates.push(new Date(s.startDate).getTime());
      if (s.endDate) allDates.push(new Date(s.endDate).getTime());
    });
    nodes.forEach((n) => { 
      if (n.startDate) allDates.push(new Date(n.startDate).getTime());
      if (n.endDate) allDates.push(new Date(n.endDate).getTime());
    });

    if (allDates.length === 0) {
      const d = new Date(); 
      d.setHours(0,0,0,0); 
      const end = new Date(d); 
      end.setDate(end.getDate() + 14);
      return { startDate: d, endDate: end, days: generateDays(d, end), weeks: generateWeeks(d, end) };
    }

    let minDate = new Date(Math.min(...allDates)); 
    minDate = getStartOfWeek(minDate);
    minDate.setDate(minDate.getDate() - 7);

    let maxDate = new Date(Math.max(...allDates)); 
    maxDate = getEndOfWeek(maxDate);
    maxDate.setDate(maxDate.getDate() + 14);

    return { 
      startDate: minDate, 
      endDate: maxDate, 
      days: generateDays(minDate, maxDate),
      weeks: generateWeeks(minDate, maxDate)
    };
  }, [sprints, nodes]);

  const getDayOffset = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return null;
    const d = new Date(dateValue); d.setHours(0,0,0,0);
    const diffDays = Math.round((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return (diffDays < 0 || diffDays >= days.length) ? null : diffDays;
  };

  return { startDate, endDate, days, weeks, getDayOffset };
}
