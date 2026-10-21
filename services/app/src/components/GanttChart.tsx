"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, CalendarDays, Diamond, Spline } from "lucide-react";
import { GanttGridHeader } from "./GanttGridHeader";
import { GanttSprintSection } from "./GanttSprintSection";
import { GanttNodeSection } from "./GanttNodeSection";
import { SegmentedControl } from "./ui/SegmentedControl";
import { DependencyArrows } from "./timeline/DependencyArrows";
import { MilestoneDialog, MilestoneMarkers } from "./timeline/MilestoneRow";
import { useProject } from "./ProjectContext";
import { dependencyEdges } from "@/lib/timeline";
import type { MilestoneInfo } from "@/lib/actions/milestones";
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
  /** Clicking a bar (without dragging it) opens the item. */
  onNodeClick?: (nodeId: string) => void;
  milestones?: MilestoneInfo[];
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  // Align to Monday (1). Sunday (0) goes back 6 days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getEndOfWeek(date: Date) {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

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

function generateWeeks(start: Date, end: Date) {
  const list = [];
  const curr = new Date(start);
  const stop = new Date(end);
  let count = 0;
  while (curr <= stop && count < 52) {
    list.push(new Date(curr));
    curr.setDate(curr.getDate() + 7);
    count++;
  }
  return list;
}

export function GanttChart({ 
  projectId,
  nodes, 
  sprints, 
  currentSprintId,
  boardLevelView = "flat",
  rowTypeIds = [],
  cardTypeIds = [],
  onNodeClick,
  milestones = []
}: Readonly<GanttChartProps>) {
  const { isReadOnly } = useProject();
  const [viewScale, setViewScale] = useState<"days" | "weeks">("days");
  const [showDeps, setShowDeps] = useState(true);
  const [dialog, setDialog] = useState<{ open: boolean; milestone: MilestoneInfo | null }>({ open: false, milestone: null });
  const contentRef = useRef<HTMLDivElement>(null);
  const edges = useMemo(() => dependencyEdges(nodes), [nodes]);
  const conflicts = edges.filter((e) => e.conflict).length;
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    title: string;
    subtitle?: string;
    badge?: string;
    badgeColor?: string;
  } | null>(null);

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

  const { startDate, endDate, days, weeks } = useMemo(() => {
    const allDates: number[] = [];
    // Ensure today's date is always included in the date range so the "Today" line is visible
    allDates.push(new Date().getTime());

    sprints.forEach((s) => { 
      if (s.startDate) {
        allDates.push(new Date(s.startDate).getTime());
      }
      if (s.endDate) {
        allDates.push(new Date(s.endDate).getTime());
      }
    });
    milestones.forEach((m) => allDates.push(new Date(m.date).getTime()));
    nodes.forEach((n) => { 
      if (n.startDate) {
        allDates.push(new Date(n.startDate).getTime());
      }
      if (n.endDate) {
        allDates.push(new Date(n.endDate).getTime());
      }
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
  }, [sprints, nodes, milestones]);

  const getDayOffset = (dateValue: string | Date | null | undefined) => {
    if (!dateValue) return null;
    const d = new Date(dateValue); d.setHours(0,0,0,0);
    const diffDays = Math.round((d.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    // The weeks view can span more days than the (capped) daily grid, so bound by the active scale.
    const visibleDays = viewScale === "days" ? days.length : weeks.length * 7;
    return (diffDays < 0 || diffDays >= visibleDays) ? null : diffDays;
  };

  const todayCol = getDayOffset(new Date());
  let todayX: number | null = null;
  if (todayCol !== null) {
    todayX = viewScale === "days" ? todayCol * 40 : (todayCol / 7) * 140;
  }

  const colWidth = viewScale === "days" ? 40 : 140;
  const totalGridWidth = (viewScale === "days" ? days.length : weeks.length) * colWidth;

  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToToday = (behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el || todayX === null) return;
    el.scrollTo({ left: Math.max(0, todayX - el.clientWidth / 3), behavior });
  };
  // Open on "today" instead of the earliest date, and re-centre when the scale changes.
  useEffect(() => {
    scrollToToday("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewScale]);

  return (
    <div className="gantt-container">
      <header className="gantt-toolbar">
        <p className="text-sm text-muted" suppressHydrationWarning>
          {startDate.toLocaleDateString()} – {endDate.toLocaleDateString()} · {sprints.length} {sprints.length === 1 ? "sprint" : "sprints"}
        </p>
        <div className="flex items-center gap-2">
          {conflicts > 0 && showDeps && (
            <span role="status" className="rounded-full bg-danger-soft px-2.5 py-0.5 text-xs font-medium text-danger" data-testid="schedule-conflicts">
              {conflicts} scheduling {conflicts === 1 ? "conflict" : "conflicts"}
            </span>
          )}
          {edges.length > 0 && (
            <button type="button" className="button-base button-secondary button-sm" aria-pressed={showDeps} onClick={() => setShowDeps((v) => !v)} title="Show arrows between items that depend on each other">
              <Spline size={14} /> Dependencies
            </button>
          )}
          {!isReadOnly && (
            <button type="button" className="button-base button-secondary button-sm" onClick={() => setDialog({ open: true, milestone: null })}>
              <Diamond size={13} /> Milestone
            </button>
          )}
          <button className="button-base button-secondary button-sm" onClick={() => scrollToToday("smooth")} disabled={todayX === null}>Today</button>
          <SegmentedControl 
            layoutId="gantt-time-scale"
            options={[
              { id: "days", label: "Days", icon: <Calendar size={14} /> },
              { id: "weeks", label: "Weeks", icon: <CalendarDays size={14} /> }
            ]}
            value={viewScale}
            onChange={(val) => setViewScale(val as "days" | "weeks")}
          />
        </div>
      </header>
 
      <div className="gantt-scroll-area" ref={scrollRef}>
        <div className="gantt-content" ref={contentRef} style={{ '--gantt-min-width': `${totalGridWidth}px` } as React.CSSProperties}>
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
          <MilestoneMarkers milestones={milestones} getDayOffset={getDayOffset} viewScale={viewScale} onOpen={(milestone) => setDialog({ open: true, milestone })} />
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
            onNodeClick={onNodeClick}
            onHover={handleHover}
            onMouseMove={handleMouseMove}
          />
          {showDeps && <DependencyArrows edges={edges} containerRef={contentRef} />}
          {todayX !== null && (
            <div className="gantt-today-line" style={{ left: `${todayX}px` }} />
          )}
          {tooltip && (
            <div 
              className="gantt-tooltip" 
              style={{ 
                left: `${tooltip.x}px`, 
                top: `${tooltip.y - 12}px`,
              }}
            >
              {tooltip.badge && (
                <span 
                  className="gantt-tooltip-badge" 
                  style={{ backgroundColor: tooltip.badgeColor || 'var(--accent)' }}
                >
                  {tooltip.badge}
                </span>
              )}
              <div className="gantt-tooltip-title">{tooltip.title}</div>
              {tooltip.subtitle && <div className="gantt-tooltip-subtitle">{tooltip.subtitle}</div>}
            </div>
          )}
        </div>
      </div>
      <MilestoneDialog projectId={projectId} open={dialog.open} milestone={dialog.milestone} canEdit={!isReadOnly} onClose={() => setDialog((d) => ({ ...d, open: false }))} />
    </div>
  );
}
