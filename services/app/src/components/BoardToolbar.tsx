"use client";

import React, { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Filter, Layers, Search, X } from "lucide-react";
import { IconRenderer } from "./IconPicker";
import { Select } from "./ui/Select";
import { useDismiss } from "./ui/useDismiss";
import { PageHeader } from "./PageHeader";
import { ViewsMenu } from "./ViewsMenu";
import { SPRINT_NAV_EVENT } from "./KeyboardShortcuts";
import { AssigneeFilter } from "./AssigneeFilter";
import type { AssigneeFilter as AssigneeFilterValue } from "@/lib/assignee";
import { Sprint, NodeType } from "@/lib/types";

type Mode = "KANBAN" | "GANTT";
type Level = { value: string; label: string };

interface BoardToolbarProps {
  mode: Mode;
  sprints: Sprint[];
  selectedSprintId: string | null;
  onSprintChange: (id: string) => void;
  /** Progress of the selected sprint (Board only). */
  sprintStats: { total: number; done: number } | null;
  nodeTypes: NodeType[];
  selectedNodeTypeIds: string[];
  onNodeTypeToggle: (id: string) => void;
  levels: Level[];
  level: string;
  onLevelChange: (value: string) => void;
  assigneeFilter: AssigneeFilterValue;
  onAssigneeFilterChange: (value: AssigneeFilterValue) => void;
  search: string;
  onSearchChange: (value: string) => void;
  hasFilters: boolean;
  onClearFilters: () => void;
  /** A moment in time, supplied once by the parent so rendering stays pure. */
  now: number;
}

const SPRINT_DOT: Record<string, string> = { ACTIVE: "var(--success)", PLANNED: "var(--faint)", COMPLETED: "var(--info)" };
const DAY = 86_400_000;

export function BoardToolbar(props: Readonly<BoardToolbarProps>) {
  const { mode, sprints, selectedSprintId, onSprintChange } = props;
  const isBoard = mode === "KANBAN";
  const index = sprints.findIndex((s) => s.id === selectedSprintId);
  const sprint = sprints[index];

  // [ and ] move between sprints.
  const stateRef = React.useRef({ sprints, index, onSprintChange });
  React.useEffect(() => { stateRef.current = { sprints, index, onSprintChange }; });
  React.useEffect(() => {
    if (!isBoard) return;
    const onNav = (e: Event) => {
      const { sprints: list, index: i, onSprintChange: change } = stateRef.current;
      const next = list[(i < 0 ? 0 : i) + (e as CustomEvent<number>).detail];
      if (next) change(next.id);
    };
    window.addEventListener(SPRINT_NAV_EVENT, onNav);
    return () => window.removeEventListener(SPRINT_NAV_EVENT, onNav);
  }, [isBoard]);

  return (
    <>
      <PageHeader
        title={isBoard ? "Board" : "Timeline"}
        description={isBoard ? "Drag cards between columns to update their status." : "Plan dates across sprints. Drag bars to reschedule, drag their edges to resize."}
        actions={isBoard && sprints.length > 0 ? (
          <div className="flex items-center gap-1">
            <button className="icon-button" onClick={() => index > 0 && onSprintChange(sprints[index - 1].id)} disabled={index <= 0} aria-label="Previous sprint">
              <ChevronLeft size={16} />
            </button>
            <div style={{ width: 230 }}>
              <Select
                options={sprints.map((s) => ({ value: s.id, label: s.name, color: SPRINT_DOT[s.status] }))}
                value={selectedSprintId ?? ""}
                onChange={onSprintChange}
                placeholder="Choose a sprint"
              />
            </div>
            <button className="icon-button" onClick={() => index >= 0 && index < sprints.length - 1 && onSprintChange(sprints[index + 1].id)} disabled={index < 0 || index >= sprints.length - 1} aria-label="Next sprint">
              <ChevronRight size={16} />
            </button>
          </div>
        ) : undefined}
      />

      {isBoard && sprint && props.sprintStats && <SprintSummary sprint={sprint} stats={props.sprintStats} now={props.now} />}

      <div className="mb-4 flex flex-wrap items-center gap-2" role="toolbar" aria-label="Filters">
        <div className="relative w-56 max-w-full">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={props.search}
            onChange={(e) => props.onSearchChange(e.target.value)}
            placeholder="Filter by title…"
            aria-label="Filter by title"
            data-shortcut-search
            className="input-planner !pl-8 !pr-7"
          />
          {props.search && (
            <button onClick={() => props.onSearchChange("")} aria-label="Clear title filter" className="absolute right-1.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-faint hover:bg-hover hover:text-fg">
              <X size={13} />
            </button>
          )}
        </div>

        <AssigneeFilter value={props.assigneeFilter} onChange={props.onAssigneeFilterChange} />
        <TypeFilter nodeTypes={props.nodeTypes} selected={props.selectedNodeTypeIds} onToggle={props.onNodeTypeToggle} />

        {props.levels.length > 1 && (
          <div className="flex items-center gap-1.5">
            <Layers size={14} className="text-faint" aria-hidden />
            <div style={{ width: 270 }} title="Group items under their parents">
              <Select
                options={props.levels.map((l) => ({ value: l.value, label: l.value === "flat" ? "No grouping" : `Group: ${l.label}` }))}
                value={props.level}
                onChange={props.onLevelChange}
              />
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          {props.hasFilters && (
            <button onClick={props.onClearFilters} className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-sm text-muted hover:bg-hover hover:text-fg">
              <X size={13} /> Clear filters
            </button>
          )}
          <ViewsMenu page={isBoard ? "board" : "timeline"} />
        </div>
      </div>
    </>
  );
}

function SprintSummary({ sprint, stats, now }: Readonly<{ sprint: Sprint; stats: { total: number; done: number }; now: number }>) {
  const percent = stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);
  const end = sprint.endDate ? new Date(sprint.endDate).getTime() : null;
  const start = sprint.startDate ? new Date(sprint.startDate).getTime() : null;
  const daysLeft = end === null ? null : Math.ceil((end - now) / DAY);

  let timing: React.ReactNode = null;
  if (sprint.status === "COMPLETED") timing = <span className="text-info">Completed</span>;
  else if (daysLeft === null) timing = null;
  else if (start !== null && now < start) timing = <span>Starts in {Math.ceil((start - now) / DAY)} {Math.ceil((start - now) / DAY) === 1 ? "day" : "days"}</span>;
  else if (daysLeft < 0) timing = <span className="text-danger">{Math.abs(daysLeft)} {Math.abs(daysLeft) === 1 ? "day" : "days"} overdue</span>;
  else if (daysLeft === 0) timing = <span className="text-warning">Ends today</span>;
  else timing = <span>{daysLeft} {daysLeft === 1 ? "day" : "days"} left</span>;

  const range = [sprint.startDate, sprint.endDate]
    .map((d) => (d ? new Date(d).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null))
    .filter(Boolean)
    .join(" – ");

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-border bg-panel px-4 py-2.5 text-sm shadow-sm" suppressHydrationWarning>
      <span className="flex items-center gap-2 font-medium">
        <span className="h-2 w-2 rounded-full" style={{ background: SPRINT_DOT[sprint.status] }} aria-hidden />
        {sprint.name}
      </span>
      {range && <span className="text-muted">{range}</span>}
      {timing && <span className="text-muted">{timing}</span>}
      <span className="ml-auto flex items-center gap-2.5 text-muted" title={`${stats.done} of ${stats.total} done`}>
        <span>{stats.done} / {stats.total} done</span>
        <span className="relative h-1.5 w-28 overflow-hidden rounded-full bg-active">
          <span className="absolute inset-y-0 left-0 rounded-full bg-success transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </span>
        <span className="w-8 text-right text-xs">{percent}%</span>
      </span>
    </div>
  );
}

function TypeFilter({ nodeTypes, selected, onToggle }: Readonly<{ nodeTypes: NodeType[]; selected: string[]; onToggle: (id: string) => void }>) {
  const [open, setOpen] = useState(false);
  const ref = useDismiss(open, () => setOpen(false));
  if (nodeTypes.length < 2) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm transition-colors ${selected.length > 0 ? "border-accent/40 bg-accent-soft text-accent" : "border-border-strong bg-panel text-muted hover:bg-hover hover:text-fg"}`}
      >
        <Filter size={13} />
        {selected.length === 0 ? "All types" : `${selected.length} ${selected.length === 1 ? "type" : "types"}`}
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-50 mt-1 w-56 animate-pop-in rounded-lg border border-border bg-panel p-1 shadow-lg">
          <button role="menuitem" onClick={() => onToggle("all")} className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-hover">
            <span className="flex h-4 w-4 items-center justify-center text-accent">{selected.length === 0 && <Check size={14} />}</span>
            All types
          </button>
          <div className="my-1 h-px bg-border" />
          {nodeTypes.map((type) => (
            <button key={type.id} role="menuitemcheckbox" aria-checked={selected.includes(type.id)} onClick={() => onToggle(type.id)} className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-hover">
              <span className="flex h-4 w-4 items-center justify-center text-accent">{selected.includes(type.id) && <Check size={14} />}</span>
              <span style={{ color: type.color || undefined }} className="flex"><IconRenderer name={type.icon || "Target"} size={13} /></span>
              <span className="truncate">{type.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
