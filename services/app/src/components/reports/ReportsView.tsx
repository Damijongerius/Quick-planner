"use client";

import React, { useMemo, useState } from "react";
import { BarChart3 } from "lucide-react";
import { averageVelocity, burndown, chooseUnit, loadOf, plannedItems, velocity } from "@/lib/planning";
import { PageHeader } from "../PageHeader";
import { BurndownChart, VelocityChart } from "./Charts";
import type { Node, Sprint } from "@/lib/types";

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function Tile({ label, value, hint }: Readonly<{ label: string; value: string; hint?: string }>) {
  return (
    <div className="rounded-lg border border-border bg-panel p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-faint">{hint}</p>}
    </div>
  );
}

export function ReportsView({ nodes, sprints }: Readonly<{ nodes: Node[]; sprints: Sprint[] }>) {
  const [now] = useState(() => Date.now());
  const started = sprints.filter((s) => s.status !== "PLANNED");
  const [sprintId, setSprintId] = useState((started.find((s) => s.status === "ACTIVE") ?? started[started.length - 1])?.id ?? "");
  const sprint = started.find((s) => s.id === sprintId) ?? null;
  const startDate = sprint?.startDate ?? null;
  const endDate = sprint?.endDate ?? null;

  const unit = useMemo(() => chooseUnit(nodes), [nodes]);
  const unitLabel = unit === "points" ? "points" : "items";
  const items = useMemo(() => (sprintId ? plannedItems(nodes, sprintId) : []), [nodes, sprintId]);
  const load = useMemo(() => loadOf(items, unit), [items, unit]);
  const series = burndown(items, unit, startDate ? new Date(startDate) : null, endDate ? new Date(endDate) : null, new Date(now));
  const history = useMemo(() => velocity(sprints, nodes, unit), [sprints, nodes, unit]);
  const average = averageVelocity(history);
  const daysLeft = sprint?.endDate ? Math.max(0, Math.ceil((new Date(sprint.endDate).getTime() - now) / 86_400_000)) : null;

  if (started.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Reports" description="Burndown and velocity for your sprints." />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong py-16 text-center">
          <BarChart3 size={28} className="text-faint" />
          <p className="max-w-sm text-sm text-muted">Reports appear once a sprint has been started. Start one from the Sprints page and they fill in as work gets done.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl pb-12">
      <PageHeader
        title="Reports"
        description={`Counting ${unitLabel}${unit === "items" ? " (add a “Story points” number field to count effort instead)" : ""}.`}
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="report-sprint" className="text-sm text-muted">Sprint</label>
            <select id="report-sprint" className="input-planner !w-72" value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
              {started.map((s) => <option key={s.id} value={s.id}>{s.name}{s.status === "ACTIVE" ? " (active)" : ""}</option>)}
            </select>
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Done" value={`${fmt(load.done)} / ${fmt(load.total)}`} hint={unitLabel} />
        <Tile label="Remaining" value={fmt(load.total - load.done)} hint={unitLabel} />
        <Tile label="Days left" value={daysLeft === null ? "—" : String(daysLeft)} hint={sprint?.endDate ? undefined : "no end date"} />
        <Tile label="Average velocity" value={average === null ? "—" : fmt(Math.round(average * 10) / 10)} hint={average === null ? "no finished sprint yet" : `${unitLabel} per sprint, last 3`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section aria-labelledby="burndown-h" className="rounded-lg border border-border bg-panel p-4">
          <h2 id="burndown-h" className="mb-3 text-sm font-semibold">Burndown{sprint ? ` · ${sprint.name}` : ""}</h2>
          {series.length > 0 && load.total > 0 ? (
            <BurndownChart points={series} unit={unitLabel} />
          ) : (
            <p className="py-12 text-center text-sm text-muted">{load.total === 0 ? "This sprint has no items yet." : "Set a start and end date on this sprint to see its burndown."}</p>
          )}
        </section>
        <section aria-labelledby="velocity-h" className="rounded-lg border border-border bg-panel p-4">
          <h2 id="velocity-h" className="mb-3 text-sm font-semibold">Velocity</h2>
          {history.length > 0 ? <VelocityChart points={history} unit={unitLabel} /> : <p className="py-12 text-center text-sm text-muted">No sprint has been started yet.</p>}
        </section>
      </div>
    </div>
  );
}
