"use client";

import React, { useState } from "react";
import { Milestone, Calendar, CalendarDays } from "lucide-react";
import { GanttGridHeader } from "./GanttGridHeader";
import { GanttSprintSection } from "./GanttSprintSection";
import { GanttNodeSection } from "./GanttNodeSection";
import { SegmentedControl } from "./ui/SegmentedControl";
import { useGanttTimeline } from "./useGanttTimeline";
import "./Gantt.css";

import { Node, Sprint } from "@/lib/types";

interface GanttChartProps {
  projectId: string;
  nodes: Node[];
  sprints: Sprint[];
  currentSprintId: string | null;
  boardLevelView?: string;
  rowTypeIds?: string[];
  cardTypeIds?: string[];
}

export function GanttChart({ 
  projectId,
  nodes, 
  sprints, 
  currentSprintId,
  boardLevelView = "flat",
  rowTypeIds = [],
  cardTypeIds = []
}: Readonly<GanttChartProps>) {
  const [viewScale, setViewScale] = useState<"days" | "weeks">("days");
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: string;
  } | null>(null);

  const { startDate, endDate, days, weeks, getDayOffset } = useGanttTimeline(nodes, sprints);

  const handleHover = (
    e: React.MouseEvent | null,
    content: { title: string; subtitle?: string; badge?: string; badgeColor?: string } | null
  ) => {
    if (!e || !content) {
      setTooltip(null);
      return;
    }
    const container = e.currentTarget.closest(".gantt-content");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      ...content
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!tooltip) return;
    const container = e.currentTarget.closest(".gantt-content");
    if (!container) return;
    const rect = container.getBoundingClientRect();
    setTooltip(prev => prev ? {
      ...prev,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    } : null);
  };

  const todayCol = getDayOffset(new Date());
  let todayX: number | null = null;
  if (todayCol !== null) {
    todayX = viewScale === "days" ? todayCol * 40 : (todayCol / 7) * 140;
  }

  const colWidth = viewScale === "days" ? 40 : 140;
  const totalGridWidth = (viewScale === "days" ? days.length : weeks.length) * colWidth;

  return (
    <div className="card-planner gantt-container">
      <header className="gantt-header flex justify-between items-center">
        <div className="flex items-center gap-md">
            <div className="gantt-header-icon"><Milestone size={20} /></div>
            <div><h3 className="gantt-header-title">Project Strategic Timeline</h3><p className="text-meta gantt-header-subtitle">{startDate.toLocaleDateString()} — {endDate.toLocaleDateString()} • {sprints.length} Cycles Defined</p></div>
        </div>
        <div className="flex items-center gap-sm">
          <SegmentedControl 
            layoutId="gantt-time-scale"
            options={[
              { id: "days", label: "Days", icon: <Calendar size={16} /> },
              { id: "weeks", label: "Weeks", icon: <CalendarDays size={16} /> }
            ]}
            value={viewScale}
            onChange={(val) => setViewScale(val as any)}
          />
        </div>
      </header>
 
      <div className="gantt-scroll-area">
        <div className="gantt-content" style={{ '--gantt-min-width': `${totalGridWidth}px` } as React.CSSProperties}>
          <GanttGridHeader 
            days={days} 
            weeks={weeks} 
            viewScale={viewScale} 
            onHover={handleHover}
            onMouseMove={handleMouseMove}
          />
          <GanttSprintSection 
            sprints={sprints} 
            currentSprintId={currentSprintId} 
            getDayOffset={getDayOffset} 
            viewScale={viewScale}
            colWidth={colWidth}
          />
          <GanttNodeSection 
            projectId={projectId}
            nodes={nodes} 
            days={days} 
            weeks={weeks}
            viewScale={viewScale}
            getDayOffset={getDayOffset} 
            boardLevelView={boardLevelView}
            rowTypeIds={rowTypeIds}
            cardTypeIds={cardTypeIds}
            onHover={handleHover}
            onMouseMove={handleMouseMove}
          />
          {todayX !== null && (
            <div className="gantt-today-line" style={{ left: `${todayX}px` }} />
          )}
          {tooltip && (
            <div className="gantt-tooltip" style={{ left: `${tooltip.x}px`, top: `${tooltip.y - 12}px` }}>
              {tooltip.badge && (
                <span className="gantt-tooltip-badge" style={{ backgroundColor: tooltip.badgeColor || 'var(--primary)' }}>
                  {tooltip.badge}
                </span>
              )}
              <div className="gantt-tooltip-title">{tooltip.title}</div>
              {tooltip.subtitle && <div className="gantt-tooltip-subtitle">{tooltip.subtitle}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
