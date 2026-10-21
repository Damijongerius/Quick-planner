"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd";
import { ArrowLeft, ArrowRight, CalendarDays, GripVertical, Search } from "lucide-react";
import { bulkUpdateNodes, restoreNodes } from "@/lib/actions";
import { chooseUnit, hasEstimateField, loadOf, plannedItems, pointsOf, type Unit } from "@/lib/planning";
import { useProject } from "../ProjectContext";
import { useToast } from "../ui/Toast";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import { PageHeader } from "../PageHeader";
import type { Node, NodeType, Sprint } from "@/lib/types";

interface PlanningViewProps {
  readonly projectId: string;
  readonly nodes: Node[];
  readonly sprints: Sprint[];
  readonly nodeTypes: NodeType[];
}

function range(sprint: Sprint): string {
  if (!sprint.startDate && !sprint.endDate) return "No dates set";
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const f = (d: Sprint["startDate"]) => (d ? new Date(d).toLocaleDateString(undefined, opts) : "…");
  return `${f(sprint.startDate)} – ${f(sprint.endDate)}`;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

export function PlanningView({ projectId, nodes, sprints, nodeTypes }: PlanningViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { isReadOnly } = useProject();

  const open = sprints.filter((s) => s.status !== "COMPLETED");
  const [sprintId, setSprintId] = useState<string>((open.find((s) => s.status === "ACTIVE") ?? open[0])?.id ?? "");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [overrides, setOverrides] = useState<Record<string, string | null>>({});
  const [seenNodes, setSeenNodes] = useState(nodes);
  if (seenNodes !== nodes) {
    setSeenNodes(nodes);
    setOverrides({});
  }

  const effective = useMemo(() => nodes.map((n) => (n.id in overrides ? { ...n, sprintId: overrides[n.id] } : n)), [nodes, overrides]);
  const sprint = open.find((s) => s.id === sprintId) ?? null;
  const unit: Unit = useMemo(() => chooseUnit(effective), [effective]);
  const unitLabel = unit === "points" ? "points" : "items";

  const backlog = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plannedItems(effective, null).filter((n) => n.status !== "DONE" && (!q || n.title.toLowerCase().includes(q)));
  }, [effective, query]);
  const inSprint = useMemo(() => (sprintId ? plannedItems(effective, sprintId) : []), [effective, sprintId]);
  const load = useMemo(() => loadOf(inSprint, unit), [inSprint, unit]);
  const capacity = sprint?.capacity ?? null;
  const over = capacity != null && load.total > capacity;
  const unestimated = unit === "points" ? inSprint.filter((n) => pointsOf(n) === 0).length : 0;

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  const move = async (ids: string[], target: string | null) => {
    if (ids.length === 0 || isReadOnly) return;
    const before = Object.fromEntries(ids.map((id) => [id, effective.find((n) => n.id === id)?.sprintId ?? null]));
    setOverrides((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, target])) }));
    setSelected(new Set());
    const result = await bulkUpdateNodes(projectId, ids, { sprintId: target });
    if (result.error) {
      setOverrides((prev) => ({ ...prev, ...before }));
      toast({ kind: "error", message: result.error });
      return;
    }
    const previous = result.previous ?? [];
    toast({
      kind: "success",
      message: `${ids.length} item${ids.length === 1 ? "" : "s"} ${target ? `added to ${sprint?.name ?? "the sprint"}` : "moved back to the backlog"}`,
      action: { label: "Undo", onClick: async () => { await restoreNodes(projectId, previous); router.refresh(); } },
    });
    router.refresh();
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;
    const ids = selected.has(draggableId) ? [...selected] : [draggableId];
    void move(ids, destination.droppableId === "sprint" ? sprint?.id ?? null : null);
  };

  if (open.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Planning" description="Pick what goes into the next sprint." />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong py-16 text-center">
          <CalendarDays size={28} className="text-faint" />
          <p className="text-sm text-muted">There is no open sprint to plan yet.</p>
          <Button onClick={() => router.push(`/project/${projectId}/sprints`)}>Create a sprint</Button>
        </div>
      </div>
    );
  }

  const list = (id: "backlog" | "sprint", items: Node[]) => (
    <Droppable droppableId={id}>
      {(drop, snapshot) => (
        <ul ref={drop.innerRef} {...drop.droppableProps} aria-label={id === "backlog" ? "Backlog items" : "Sprint items"} className={`min-h-[160px] flex-1 overflow-y-auto rounded-lg border p-1.5 transition-colors ${snapshot.isDraggingOver ? "border-accent bg-accent-soft" : "border-border bg-panel"}`}>
          {items.length === 0 && !snapshot.isDraggingOver && (
            <li className="px-3 py-10 text-center text-sm text-faint">{id === "backlog" ? "Nothing left in the backlog." : "Drag items here, or use the arrow on an item."}</li>
          )}
          {items.map((item, index) => (
            <Draggable key={item.id} draggableId={item.id} index={index} isDragDisabled={isReadOnly}>
              {(drag, dragSnapshot) => (
                <li ref={drag.innerRef} {...drag.draggableProps} className={`group flex items-center gap-2 rounded-md px-1.5 py-1.5 ${dragSnapshot.isDragging ? "bg-panel shadow-lg ring-1 ring-accent/40" : "hover:bg-hover"}`}>
                  {!isReadOnly && (
                    <span {...drag.dragHandleProps} aria-label={`Drag ${item.title}`} className="cursor-grab text-faint"><GripVertical size={14} /></span>
                  )}
                  {!isReadOnly && (
                    <input type="checkbox" aria-label={`Select ${item.title}`} checked={selected.has(item.id)} onChange={() => toggle(item.id)} className="h-3.5 w-3.5 accent-[var(--accent)]" />
                  )}
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.type?.color || "var(--accent)" }} title={item.type?.name} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{item.title}</span>
                    {item.parentLinks?.[0] && <span className="block truncate text-xs text-faint">{item.parentLinks[0].parentNode.title}</span>}
                  </span>
                  <StatusBadge status={item.status} className="hidden sm:inline-flex" />
                  {item.assignee && <Avatar src={item.assignee.image} name={item.assignee.name} size="xs" />}
                  {pointsOf(item) > 0 && <span className="rounded-full bg-hover px-1.5 text-xs tabular-nums text-muted" title="Estimate">{fmt(pointsOf(item))}</span>}
                  {!isReadOnly && (
                    <button
                      type="button"
                      className="icon-button !h-6 !w-6"
                      aria-label={id === "backlog" ? `Add ${item.title} to ${sprint?.name ?? "sprint"}` : `Move ${item.title} back to the backlog`}
                      onClick={() => move([item.id], id === "backlog" ? sprint?.id ?? null : null)}
                    >
                      {id === "backlog" ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                    </button>
                  )}
                </li>
              )}
            </Draggable>
          ))}
          {drop.placeholder}
        </ul>
      )}
    </Droppable>
  );

  return (
    <div className="mx-auto flex h-full max-w-6xl flex-col">
      <PageHeader
        title="Planning"
        description="Pull work from the backlog into a sprint and keep an eye on the load."
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="planning-sprint" className="text-sm text-muted">Sprint</label>
            <select id="planning-sprint" className="input-planner !w-72" value={sprintId} onChange={(e) => { setSprintId(e.target.value); setSelected(new Set()); }}>
              {open.map((s) => <option key={s.id} value={s.id}>{s.name}{s.status === "ACTIVE" ? " (active)" : ""}</option>)}
            </select>
          </div>
        }
      />

      {sprint && (
        <section aria-label="Sprint load" className="mb-4 rounded-lg border border-border bg-panel p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-medium">{sprint.name} <span className="font-normal text-muted">· {range(sprint)}</span></p>
            <p className={`text-sm tabular-nums ${over ? "font-medium text-danger" : "text-muted"}`} data-testid="sprint-load">
              {fmt(load.total)}{capacity != null ? ` / ${fmt(capacity)}` : ""} {unitLabel}
              {over && <span> · over capacity by {fmt(load.total - (capacity ?? 0))}</span>}
            </p>
          </div>
          {capacity != null && (
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-active" role="progressbar" aria-valuenow={load.total} aria-valuemin={0} aria-valuemax={capacity} aria-label="Sprint load against capacity">
              <div className={`h-full rounded-full transition-[width] duration-300 ${over ? "bg-danger" : "bg-accent"}`} style={{ width: `${Math.min(100, capacity === 0 ? 100 : (load.total / capacity) * 100)}%` }} />
            </div>
          )}
          {capacity == null && <p className="mt-1.5 text-xs text-faint">Set a capacity on the Sprints page (Edit) to see how full this sprint is.</p>}
          {unit === "items" && !hasEstimateField(nodeTypes) && <p className="mt-1 text-xs text-faint">Counting items. Add a number field called “Story points” to an item type to plan by effort.</p>}
          {unestimated > 0 && <p className="mt-1 text-xs text-warning">{unestimated} item{unestimated === 1 ? " has" : "s have"} no estimate yet.</p>}
          {load.byAssignee.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-muted" aria-label="Load per person">
              {load.byAssignee.map((a) => (
                <li key={a.id ?? "none"} className="flex items-center gap-1.5">
                  <span className="font-medium text-fg">{a.name}</span>
                  <span className="tabular-nums">{fmt(a.total)} {unitLabel}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
          <div className="flex min-h-0 flex-col gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold">Backlog</h2>
              <span className="text-xs text-faint">{backlog.length}</span>
              <div className="relative ml-auto">
                <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" />
                <input aria-label="Filter backlog" placeholder="Filter" className="input-planner !h-8 !w-44 !pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
              </div>
            </div>
            {list("backlog", backlog)}
          </div>
          <div className="flex min-h-0 flex-col gap-2">
            <div className="flex h-8 items-center gap-2">
              <h2 className="text-sm font-semibold">{sprint?.name ?? "Sprint"}</h2>
              <span className="text-xs text-faint">{inSprint.length}</span>
            </div>
            {list("sprint", inSprint)}
          </div>
        </div>
      </DragDropContext>

      {selected.size > 0 && !isReadOnly && (
        <div role="region" aria-label="Selection" className="sticky bottom-4 mt-4 flex items-center gap-3 self-center rounded-lg border border-border bg-panel px-4 py-2 shadow-lg animate-pop-in">
          <span className="text-sm">{selected.size} selected</span>
          <Button size="sm" onClick={() => move([...selected], sprint?.id ?? null)}>Add to {sprint?.name ?? "sprint"}</Button>
          <Button size="sm" variant="secondary" onClick={() => move([...selected], null)}>Back to backlog</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}
    </div>
  );
}
