"use client";

import React, { useState } from "react";
import { Play, CheckCircle2, Trash2, CalendarDays, Pencil } from "lucide-react";
import { Button } from "./ui/Button";
import { updateSprintStatus, deleteSprint, updateSprint } from "@/lib/actions";
import { Sprint } from "@/lib/types";

export type SprintWithCounts = Sprint & { _count?: { nodes: number }; doneCount?: number };

interface SprintCardProps {
  sprint: SprintWithCounts;
  projectId: string;
  isReadOnly?: boolean;
}

const STATUS_STYLE: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-success-soft text-success" },
  PLANNED: { label: "Planned", className: "bg-hover text-muted" },
  COMPLETED: { label: "Completed", className: "bg-info-soft text-info" },
};

function formatRange(sprint: Sprint): string {
  if (!sprint.startDate && !sprint.endDate) return "No dates set";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const start = sprint.startDate ? new Date(sprint.startDate).toLocaleDateString(undefined, opts) : "…";
  const end = sprint.endDate ? new Date(sprint.endDate).toLocaleDateString(undefined, { ...opts, year: "numeric" }) : "…";
  return `${start} – ${end}`;
}

export function SprintCard({ sprint, projectId, isReadOnly }: Readonly<SprintCardProps>) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(sprint.name);
  const [start, setStart] = useState(sprint.startDate ? new Date(sprint.startDate).toISOString().slice(0, 10) : "");
  const [end, setEnd] = useState(sprint.endDate ? new Date(sprint.endDate).toISOString().slice(0, 10) : "");
  const [capacity, setCapacity] = useState(sprint.capacity != null ? String(sprint.capacity) : "");
  const [editError, setEditError] = useState("");
  const style = STATUS_STYLE[sprint.status] ?? STATUS_STYLE.PLANNED;
  const total = sprint._count?.nodes ?? 0;
  const done = sprint.doneCount ?? 0;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  const run = async (fn: () => Promise<unknown>, failure: string) => {
    setBusy(true);
    try {
      await fn();
    } catch (error) {
      console.error(failure, error);
      alert(failure);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setEditError("");
    const result = await updateSprint(projectId, sprint.id, { name, startDate: start || null, endDate: end || null, capacity: capacity.trim() === "" ? null : Number(capacity) });
    setBusy(false);
    if (result.error) {
      setEditError(result.error);
      return;
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <form onSubmit={saveEdit} className="flex flex-col gap-3 border-b border-border bg-sidebar px-4 py-3 last:border-b-0">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label htmlFor={`sprint-name-${sprint.id}`} className="form-field-label">Name</label>
            <input id={`sprint-name-${sprint.id}`} autoFocus className="input-planner mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          </div>
          <div>
            <label htmlFor={`sprint-start-${sprint.id}`} className="form-field-label">Start date</label>
            <input id={`sprint-start-${sprint.id}`} type="date" className="input-planner mt-1" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`sprint-end-${sprint.id}`} className="form-field-label">End date</label>
            <input id={`sprint-end-${sprint.id}`} type="date" className="input-planner mt-1" value={end} min={start || undefined} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div>
            <label htmlFor={`sprint-capacity-${sprint.id}`} className="form-field-label">Capacity</label>
            <input id={`sprint-capacity-${sprint.id}`} type="number" min={0} step="any" placeholder="points or items" className="input-planner mt-1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
          </div>
        </div>
        {editError && <p className="text-sm text-danger" role="alert">{editError}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={busy}>Save</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-border px-4 py-3 last:border-b-0">
      <div className="min-w-[200px] flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{sprint.name}</h3>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${style.className}`}>{style.label}</span>
        </div>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted" suppressHydrationWarning>
          <CalendarDays size={12} /> {formatRange(sprint)}
        </p>
      </div>

      <div className="w-44" title={`${done} of ${total} done`}>
        <div className="mb-1 flex justify-between text-xs text-muted">
          <span>{total === 0 ? "No items" : `${done} of ${total} done`}</span>
          {total > 0 && <span>{percent}%</span>}
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-active">
          <div className="h-full rounded-full bg-success transition-[width] duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {!isReadOnly && (
        <div className="flex w-[150px] items-center justify-end gap-1.5">
          {sprint.status === "PLANNED" && (
            <Button size="sm" disabled={busy} onClick={() => run(() => updateSprintStatus(projectId, sprint.id, "ACTIVE"), "Could not start the sprint.")} icon={<Play size={12} fill="currentColor" />}>
              Start
            </Button>
          )}
          {sprint.status === "ACTIVE" && (
            <Button size="sm" variant="success" disabled={busy} onClick={() => run(() => updateSprintStatus(projectId, sprint.id, "COMPLETED"), "Could not complete the sprint.")} icon={<CheckCircle2 size={14} />}>
              Complete
            </Button>
          )}
          <Button size="sm" variant="ghost" disabled={busy} aria-label={`Edit ${sprint.name}`} onClick={() => setEditing(true)} icon={<Pencil size={14} />} />
          <Button
            size="sm"
            variant="ghost"
            disabled={busy}
            aria-label={`Delete ${sprint.name}`}
            className="hover:!text-danger"
            onClick={() => {
              if (confirm(`Delete “${sprint.name}”? Its items move back to the backlog.`)) run(() => deleteSprint(projectId, sprint.id), "Could not delete the sprint.");
            }}
            icon={<Trash2 size={14} />}
          />
        </div>
      )}
    </div>
  );
}
