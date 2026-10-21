import { guessStatus } from "./normalize";
import type { ImportItem, ImportPlan, ItemStatus, ParsedImport } from "./types";

export interface StatusChoice { raw: string; count: number; guess: ItemStatus | null }
export interface Mappings {
  /** source status text -> status; entries win over the automatic guess */
  statusMap: Record<string, ItemStatus>;
  /** source type name -> item type to use (existing or new) */
  typeMap: Record<string, string>;
  defaultType?: string;
}

function tally<T>(values: (T | undefined)[]): Map<T, number> {
  const out = new Map<T, number>();
  for (const v of values) if (v !== undefined && v !== "") out.set(v, (out.get(v) ?? 0) + 1);
  return out;
}

/** The distinct status words in the file, with how many items use each and our best guess. */
export function statusChoices(items: ImportItem[]): StatusChoice[] {
  return [...tally(items.filter((i) => !i.status).map((i) => i.rawStatus?.trim()))]
    .map(([raw, count]) => ({ raw, count, guess: guessStatus(raw) }))
    .sort((a, b) => b.count - a.count);
}

export function typeChoices(items: ImportItem[]): { name: string; count: number }[] {
  return [...tally(items.map((i) => i.type?.trim()))].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export function assigneeChoices(items: ImportItem[]): { label: string; count: number }[] {
  return [...tally(items.map((i) => i.assignee?.trim()))].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
}

export function matchPerson<T extends { email: string | null; name: string | null }>(label: string, people: T[]): T | undefined {
  const k = label.trim().toLowerCase();
  return people.find((p) => (p.email && p.email.toLowerCase() === k) || (p.name && p.name.toLowerCase() === k));
}

/** The request the server understands: statuses resolved, source type names replaced by the chosen ones. */
export function buildPlan(parsed: ParsedImport, mappings: Mappings): ImportPlan {
  const items = parsed.items.map((item): ImportItem => {
    const raw = item.rawStatus?.trim();
    const status = item.status ?? (raw ? mappings.statusMap[raw] ?? guessStatus(raw) : null) ?? "TODO";
    const type = item.type?.trim() ? mappings.typeMap[item.type.trim()] ?? item.type.trim() : undefined;
    const { rawStatus: _raw, ...rest } = item;
    return { ...rest, status, ...(type ? { type } : {}) };
  });
  return { source: parsed.source, items, sprints: parsed.sprints, milestones: parsed.milestones, blueprint: parsed.blueprint, defaultType: mappings.defaultType };
}

export function describePlan(plan: ImportPlan) {
  const refs = new Set(plan.items.map((i) => i.ref));
  return {
    items: plan.items.length,
    sprints: new Set([...(plan.sprints ?? []).map((s) => s.name), ...plan.items.map((i) => i.sprint).filter(Boolean)]).size,
    links: plan.items.filter((i) => i.parentRef && refs.has(i.parentRef)).length,
    dependencies: plan.items.reduce((n, i) => n + (i.blockedBy ?? []).filter((r) => refs.has(r)).length, 0),
    archived: plan.items.filter((i) => i.archived).length,
    done: plan.items.filter((i) => i.status === "DONE").length,
    milestones: plan.milestones?.length ?? 0,
  };
}
