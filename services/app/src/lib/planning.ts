import type { Node, NodeType, Sprint } from "./types";

/** A numeric custom field whose name looks like an estimate counts as the item's size. */
const ESTIMATE_NAME = /point|estimate|effort|size|\bsp\b/i;

export type Unit = "points" | "items";

export function isEstimateField(field: { name: string; type: string }): boolean {
  return field.type === "NUMBER" && ESTIMATE_NAME.test(field.name);
}

/** Story points (or hours, or whatever the team calls it) recorded on an item; 0 when there is none. */
export function pointsOf(node: Pick<Node, "content" | "type">): number {
  const content = node.content ?? {};
  let total = 0;
  for (const field of node.type?.fields ?? []) {
    if (!isEstimateField(field)) continue;
    const raw = content[field.name];
    const value = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() !== "" ? Number(raw) : NaN;
    if (Number.isFinite(value) && value > 0) total += value;
  }
  return total;
}

/** Whether any item type has an estimate field the planner can read. */
export function hasEstimateField(nodeTypes: Pick<NodeType, "fields">[]): boolean {
  return nodeTypes.some((t) => (t.fields ?? []).some(isEstimateField));
}

/** Count in points when anything is estimated, otherwise fall back to counting items. */
export function chooseUnit(nodes: Pick<Node, "content" | "type">[]): Unit {
  return nodes.some((n) => pointsOf(n) > 0) ? "points" : "items";
}

export function weightOf(node: Pick<Node, "content" | "type">, unit: Unit): number {
  return unit === "points" ? pointsOf(node) : 1;
}

/**
 * The work items of a sprint (or of the backlog when `sprintId` is null): active leaves only, so an epic
 * and the tasks inside it are not counted twice.
 */
export function plannedItems(nodes: Node[], sprintId: string | null): Node[] {
  const inScope = nodes.filter((n) => !n.isArchived && (n.sprintId ?? null) === sprintId);
  const ids = new Set(inScope.map((n) => n.id));
  const hasChildInScope = new Set<string>();
  for (const n of inScope) {
    for (const link of n.parentLinks ?? []) if (ids.has(link.parentNode.id)) hasChildInScope.add(link.parentNode.id);
  }
  return inScope.filter((n) => !hasChildInScope.has(n.id));
}

export interface Load {
  total: number;
  done: number;
  items: number;
  byAssignee: { id: string | null; name: string; total: number }[];
}

export function loadOf(items: Node[], unit: Unit): Load {
  let total = 0;
  let done = 0;
  const per = new Map<string | null, { name: string; total: number }>();
  for (const item of items) {
    const w = weightOf(item, unit);
    total += w;
    if (item.status === "DONE") done += w;
    const key = item.assigneeId ?? null;
    const entry = per.get(key) ?? { name: item.assignee?.name || item.assignee?.email || "Unassigned", total: 0 };
    entry.total += w;
    per.set(key, entry);
  }
  return {
    total,
    done,
    items: items.length,
    byAssignee: [...per.entries()].map(([id, v]) => ({ id, ...v })).sort((a, b) => b.total - a.total),
  };
}

/** When an item was finished: the recorded time, or its last update for items completed before we tracked it. */
export function doneAt(node: Pick<Node, "status" | "completedAt" | "updatedAt">): Date | null {
  if (node.status !== "DONE") return null;
  return new Date(node.completedAt ?? node.updatedAt);
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function eachDay(start: Date, end: Date): string[] {
  const days: string[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  while (cursor.getTime() <= last && days.length < 400) {
    days.push(dayKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return days;
}

export interface BurndownPoint {
  day: string;
  ideal: number;
  /** Remaining work at the end of that day; null for days that haven't happened yet. */
  actual: number | null;
}

/** Remaining work per day across a sprint. Empty when the sprint has no usable dates. */
export function burndown(items: Node[], unit: Unit, start: Date | null, end: Date | null, now: Date = new Date()): BurndownPoint[] {
  if (!start || !end || end.getTime() < start.getTime()) return [];
  const days = eachDay(start, end);
  const total = items.reduce((sum, n) => sum + weightOf(n, unit), 0);
  const finished = items
    .map((n) => ({ at: doneAt(n), w: weightOf(n, unit) }))
    .filter((x): x is { at: Date; w: number } => x.at !== null);
  const today = dayKey(now);
  return days.map((day, i) => {
    const ideal = days.length === 1 ? 0 : total * (1 - i / (days.length - 1));
    if (day > today) return { day, ideal, actual: null };
    const doneByThen = finished.filter((f) => dayKey(f.at) <= day).reduce((sum, f) => sum + f.w, 0);
    return { day, ideal, actual: total - doneByThen };
  });
}

export interface VelocityPoint {
  sprintId: string;
  name: string;
  committed: number;
  completed: number;
  status: Sprint["status"];
}

/** Committed vs. completed work for each finished (or running) sprint, oldest first. */
export function velocity(sprints: Sprint[], nodes: Node[], unit: Unit): VelocityPoint[] {
  return sprints
    .filter((s) => s.status !== "PLANNED")
    .map((s) => {
      const load = loadOf(plannedItems(nodes, s.id), unit);
      return { sprintId: s.id, name: s.name, committed: load.total, completed: load.done, status: s.status };
    });
}

/** Average completed work over the last `window` completed sprints (null when none have finished). */
export function averageVelocity(points: VelocityPoint[], window = 3): number | null {
  const finished = points.filter((p) => p.status === "COMPLETED").slice(-window);
  if (finished.length === 0) return null;
  return finished.reduce((sum, p) => sum + p.completed, 0) / finished.length;
}
