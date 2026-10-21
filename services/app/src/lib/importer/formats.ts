import { parseCsv, unguardFormula } from "./csv";
import { clip, guessStatus, isDropped, parseLooseDate, parseLooseNumber } from "./normalize";
import { IMPORT_LIMITS, type Blueprint, type ImportItem, type ImportSource, type ImportSprint, type ItemStatus, type ParsedImport } from "./types";

// ---------------------------------------------------------------------------
// CSV: Jira, Linear, Asana and anything else with a header row
// ---------------------------------------------------------------------------

export type CsvField = "ref" | "title" | "description" | "type" | "status" | "parent" | "assignee" | "sprint" | "startDate" | "endDate" | "completedAt" | "blockedBy" | "archived";
export type CsvFlavor = Extract<ImportSource, "jira" | "linear" | "asana" | "csv" | "quick-planner">;
export interface ColumnMapping {
  fields: Partial<Record<CsvField, string>>;
  /** Columns kept as custom fields on the item. */
  custom: string[];
}

export const CSV_FIELD_LABELS: Record<CsvField, string> = {
  title: "Title",
  ref: "ID / key",
  description: "Description",
  type: "Item type",
  status: "Status",
  parent: "Parent",
  assignee: "Assignee",
  sprint: "Sprint",
  startDate: "Start date",
  endDate: "Due date",
  completedAt: "Completed on",
  blockedBy: "Blocked by",
  archived: "Archived",
};

const SYNONYMS: Record<CsvField, string[]> = {
  title: ["title", "summary", "name", "task name", "task", "subject", "item", "card", "card name"],
  ref: ["id", "key", "issue key", "task id", "ref", "#", "identifier", "issue id"],
  description: ["description", "notes", "details", "body"],
  type: ["type", "issue type", "item type", "kind", "category"],
  status: ["status", "state", "column", "stage", "list", "section/column"],
  parent: ["parent", "parent id", "parent task", "parent issue", "epic", "epic link", "parent key", "parent ref"],
  assignee: ["assignee", "assignee email", "assigned to", "owner", "assigned"],
  sprint: ["sprint", "iteration", "cycle", "cycle name"],
  startDate: ["start", "start date", "begin", "starts"],
  endDate: ["due", "due date", "end date", "deadline", "target date", "finish", "end"],
  completedAt: ["completed", "completed at", "completed on", "closed at", "resolved", "done date", "date completed"],
  blockedBy: ["blocked by", "depends on", "dependencies", "blocked by (dependencies)"],
  archived: ["archived", "is archived"],
};

const CUSTOM_HINTS = /^(story points?|story point estimate|estimate|points?|effort|size|priority|severity|labels?|tags?|component\/s|components?|environment|reporter|creator|project)$/i;

const norm = (s: string) => s.trim().toLowerCase();

function findHeader(headers: string[], candidates: string[]): string | undefined {
  for (const c of candidates) {
    const hit = headers.find((h) => norm(h) === c);
    if (hit) return hit;
  }
  return undefined;
}

function fieldNameFor(header: string): string {
  const wrapped = /^custom field \((.+)\)$/i.exec(header.trim());
  const base = wrapped ? wrapped[1] : header.trim();
  if (/^(story point estimate|story points?|points?|estimate)$/i.test(base)) return "Story points";
  return base;
}

export function detectCsvFlavor(headers: string[]): CsvFlavor {
  const h = new Set(headers.map(norm));
  if (h.has("issue key") && (h.has("summary") || h.has("issue type"))) return "jira";
  if (h.has("task id") && h.has("name")) return "asana";
  if (h.has("title") && h.has("team") && (h.has("id") || h.has("status"))) return "linear";
  if (h.has("id") && h.has("type") && h.has("title") && h.has("parent id")) return "quick-planner";
  return "csv";
}

/** Best-guess column mapping for a header row. The wizard lets the user change every entry. */
export function guessMapping(headers: string[], flavor: CsvFlavor = detectCsvFlavor(headers)): ColumnMapping {
  const fields: ColumnMapping["fields"] = {};
  const put = (field: CsvField, header: string | undefined) => { if (header) fields[field] = header; };
  for (const field of Object.keys(SYNONYMS) as CsvField[]) put(field, findHeader(headers, SYNONYMS[field]));
  if (flavor === "jira") {
    put("ref", findHeader(headers, ["issue key"]));
    put("parent", findHeader(headers, ["parent", "parent id", "custom field (epic link)", "epic link"]));
    put("title", findHeader(headers, ["summary"]));
    put("endDate", findHeader(headers, ["due date", "due"]));
    put("startDate", findHeader(headers, ["start date", "custom field (start date)"]));
    put("completedAt", findHeader(headers, ["resolved"]));
  } else if (flavor === "linear") {
    put("ref", findHeader(headers, ["id"]));
    put("parent", findHeader(headers, ["parent issue"]));
    put("sprint", findHeader(headers, ["cycle name", "cycle number"]));
    put("startDate", findHeader(headers, ["started"]));
    put("completedAt", findHeader(headers, ["completed"]));
    put("endDate", findHeader(headers, ["due date"]));
  } else if (flavor === "asana") {
    put("ref", findHeader(headers, ["task id"]));
    put("title", findHeader(headers, ["name"]));
    put("assignee", findHeader(headers, ["assignee email", "assignee"]));
    put("status", findHeader(headers, ["section/column", "status"]));
    put("parent", findHeader(headers, ["parent task"]));
    put("completedAt", findHeader(headers, ["completed at"]));
  }
  const used = new Set(Object.values(fields).map((v) => norm(v)));
  const custom = headers.filter((h, i) => headers.indexOf(h) === i && !used.has(norm(h)) && CUSTOM_HINTS.test(fieldNameFor(h)));
  // Jira writes the estimate as "Custom field (Story point estimate)"; Linear as "Estimate".
  for (const h of headers) if (!used.has(norm(h)) && !custom.includes(h) && /story point/i.test(h)) custom.push(h);
  return { fields, custom };
}

/** Values from every column with this header (Jira repeats "Sprint" once per sprint an issue was in). */
function cells(row: string[], headers: string[], header: string | undefined): string[] {
  if (!header) return [];
  const out: string[] = [];
  headers.forEach((h, i) => { if (h === header && (row[i] ?? "").trim()) out.push(unguardFormula(row[i].trim())); });
  return out;
}

const splitList = (s: string) => s.split(/[\n;|,]+/).map((x) => x.trim()).filter(Boolean);

function setField(item: ImportItem, name: string, raw: string) {
  const text = raw.trim();
  if (!text) return;
  const n = /^-?\d+([.,]\d+)?$/.test(text) ? parseLooseNumber(text) : undefined;
  item.fields = { ...(item.fields ?? {}), [name]: n !== undefined ? n : clip(text, IMPORT_LIMITS.fieldValue) ?? text };
}

export function buildFromCsv(rows: string[][], mapping: ColumnMapping, flavor: CsvFlavor = "csv"): ParsedImport {
  const warnings: string[] = [];
  const [headers = [], ...body] = rows;
  const f = mapping.fields;
  const items: ImportItem[] = [];
  const usedRefs = new Set<string>();
  /** every way a row can be referred to: its key, its numeric id, its title */
  const aliases = new Map<string, string>();
  const titleCount = new Map<string, number>();
  const pending: { item: ImportItem; parent?: string; blocked: string[]; outward: string[] }[] = [];
  let skipped = 0;

  if (!f.title) return { source: flavor, items: [], sprints: [], milestones: [], warnings: ["Choose which column holds the item title."] };

  body.forEach((row, index) => {
    const title = clip(cells(row, headers, f.title)[0], IMPORT_LIMITS.title);
    if (!title) { skipped++; return; }
    let ref = cells(row, headers, f.ref)[0] ?? `row-${index + 2}`;
    while (usedRefs.has(ref)) ref = `${ref}#${index + 2}`;
    usedRefs.add(ref);

    const item: ImportItem = { ref, title };
    const description = clip(cells(row, headers, f.description)[0], IMPORT_LIMITS.description);
    if (description) item.description = description;
    const type = cells(row, headers, f.type)[0];
    if (type) item.type = type;

    let rawStatus = cells(row, headers, f.status)[0];
    const completed = parseLooseDate(cells(row, headers, f.completedAt)[0]);
    if (flavor === "asana" && completed && !/done|complete/i.test(rawStatus ?? "")) rawStatus = "Completed";
    if (flavor === "linear" && row[headers.findIndex((h) => norm(h) === "canceled")]?.trim()) rawStatus = "Canceled";
    if (!rawStatus && completed) rawStatus = "Done";
    if (rawStatus) item.rawStatus = rawStatus;
    if (isDropped(rawStatus)) item.archived = true;
    if (completed) item.completedAt = completed;

    const assignee = cells(row, headers, f.assignee)[0];
    if (assignee) item.assignee = assignee;
    const sprints = cells(row, headers, f.sprint);
    if (sprints.length === 0 && flavor === "linear") sprints.push(...cells(row, headers, headers.find((h) => norm(h) === "cycle number")));
    if (sprints.length > 0) {
      const last = sprints[sprints.length - 1];
      item.sprint = flavor === "linear" && /^\d+$/.test(last) ? `Cycle ${last}` : last;
    }
    const start = parseLooseDate(cells(row, headers, f.startDate)[0]);
    const end = parseLooseDate(cells(row, headers, f.endDate)[0]);
    if (start) item.startDate = start;
    if (end) item.endDate = end;
    const archived = cells(row, headers, f.archived)[0];
    if (archived && /^(true|yes|y|1|archived)$/i.test(archived)) item.archived = true;

    for (const header of mapping.custom) for (const value of cells(row, headers, header)) setField(item, fieldNameFor(header), value);

    aliases.set(norm(ref), ref);
    const keyedId = flavor === "jira" ? cells(row, headers, headers.find((h) => norm(h) === "issue id")) [0] : undefined;
    if (keyedId) aliases.set(norm(keyedId), ref);
    titleCount.set(norm(title), (titleCount.get(norm(title)) ?? 0) + 1);

    const parent = cells(row, headers, f.parent)[0] ?? (flavor === "jira" ? cells(row, headers, headers.find((h) => norm(h) === "custom field (epic link)"))[0] : undefined);
    const blocked = cells(row, headers, f.blockedBy);
    // Jira stores "blocks" links on both issues, under two column families.
    const outward = flavor === "jira" ? headers.flatMap((h) => (/^outward issue link \(blocks\)$/i.test(h) ? cells(row, headers, h) : [])) : [];
    const inward = flavor === "jira" ? headers.flatMap((h) => (/^inward issue link \(blocks\)$/i.test(h) ? cells(row, headers, h) : [])) : [];
    pending.push({ item, parent, blocked: [...blocked, ...inward], outward });
    items.push(item);
  });

  // Second pass: links can point forward in the file, so they are resolved once every row is known.
  const byTitle = new Map(items.map((i) => [norm(i.title), i.ref]));
  const resolve = (token: string): string | undefined => {
    const key = norm(token);
    const direct = aliases.get(key);
    if (direct) return direct;
    if (titleCount.get(key) === 1) return byTitle.get(key);
    return undefined;
  };
  let unresolved = 0;
  for (const p of pending) {
    if (p.parent) {
      const target = resolve(p.parent);
      if (target && target !== p.item.ref) p.item.parentRef = target;
      else if (!target) unresolved++;
    }
    const blockers = new Set<string>();
    for (const cell of p.blocked) {
      const whole = resolve(cell);
      for (const token of whole ? [cell] : splitList(cell)) {
        const target = resolve(token);
        if (target && target !== p.item.ref) blockers.add(target); else if (!target) unresolved++;
      }
    }
    if (blockers.size > 0) p.item.blockedBy = [...blockers];
  }
  for (const p of pending) {
    for (const cell of p.outward) {
      for (const token of splitList(cell)) {
        const blocked = items.find((i) => i.ref === resolve(token));
        if (blocked && blocked.ref !== p.item.ref) blocked.blockedBy = [...new Set([...(blocked.blockedBy ?? []), p.item.ref])];
        else if (!blocked) unresolved++;
      }
    }
  }

  if (skipped > 0) warnings.push(`${skipped} row${skipped === 1 ? "" : "s"} without a title ${skipped === 1 ? "was" : "were"} skipped.`);
  if (unresolved > 0) warnings.push(`${unresolved} parent or dependency link${unresolved === 1 ? "" : "s"} pointed at items that are not in this file and ${unresolved === 1 ? "was" : "were"} ignored.`);

  return { source: flavor, items, sprints: sprintsFromItems(items), milestones: [], warnings };
}

export function sprintsFromItems(items: ImportItem[]): ImportSprint[] {
  const names = new Map<string, ImportSprint>();
  for (const item of items) if (item.sprint && !names.has(item.sprint)) names.set(item.sprint, { name: item.sprint });
  return [...names.values()];
}

// ---------------------------------------------------------------------------
// Trello JSON board export
// ---------------------------------------------------------------------------

interface TrelloBoard {
  name?: string;
  lists?: { id: string; name: string; closed?: boolean; pos?: number }[];
  cards?: { id: string; name: string; desc?: string; idList: string; closed?: boolean; due?: string | null; start?: string | null; dueComplete?: boolean; idMembers?: string[]; idLabels?: string[]; labels?: { name?: string; color?: string }[]; pos?: number }[];
  checklists?: { id: string; idCard: string; name?: string; checkItems?: { name: string; state?: string; pos?: number }[] }[];
  members?: { id: string; fullName?: string; username?: string }[];
}

export function parseTrello(board: TrelloBoard): ParsedImport {
  const warnings: string[] = [];
  const lists = new Map((board.lists ?? []).map((l) => [l.id, l]));
  const members = new Map((board.members ?? []).map((m) => [m.id, m.fullName || m.username || ""]));
  const checklistsByCard = new Map<string, NonNullable<TrelloBoard["checklists"]>>();
  for (const c of board.checklists ?? []) checklistsByCard.set(c.idCard, [...(checklistsByCard.get(c.idCard) ?? []), c]);
  const listOrder = [...lists.values()].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0));
  const cards = [...(board.cards ?? [])].sort((a, b) => {
    const la = listOrder.findIndex((l) => l.id === a.idList), lb = listOrder.findIndex((l) => l.id === b.idList);
    return la - lb || (a.pos ?? 0) - (b.pos ?? 0);
  });

  const items: ImportItem[] = [];
  for (const card of cards) {
    const title = clip(card.name, IMPORT_LIMITS.title);
    if (!title) continue;
    const list = lists.get(card.idList);
    const item: ImportItem = { ref: card.id, title, type: "Task", rawStatus: card.dueComplete ? "Done" : list?.name };
    const description = clip(card.desc, IMPORT_LIMITS.description);
    if (description) item.description = description;
    if (card.closed || list?.closed) item.archived = true;
    const due = parseLooseDate(card.due ?? undefined);
    const start = parseLooseDate(card.start ?? undefined);
    if (due) item.endDate = due;
    if (start) item.startDate = start;
    const person = (card.idMembers ?? []).map((id) => members.get(id)).find(Boolean);
    if (person) item.assignee = person;
    const labels = (card.labels ?? []).map((l) => l.name || l.color).filter(Boolean);
    if (labels.length > 0) item.fields = { Labels: labels.join(", ") };
    items.push(item);

    for (const checklist of checklistsByCard.get(card.id) ?? []) {
      for (const entry of [...(checklist.checkItems ?? [])].sort((a, b) => (a.pos ?? 0) - (b.pos ?? 0))) {
        const name = clip(entry.name, IMPORT_LIMITS.title);
        if (!name) continue;
        items.push({ ref: `${card.id}:${items.length}`, title: name, type: "Subtask", parentRef: card.id, rawStatus: entry.state === "complete" ? "Done" : "To do" });
      }
    }
  }
  const unknownLists = new Set(items.filter((i) => i.rawStatus && !guessStatus(i.rawStatus)).map((i) => i.rawStatus));
  if (unknownLists.size > 0) warnings.push(`Trello lists without an obvious status (${[...unknownLists].slice(0, 5).join(", ")}) are set to “To do”. You can change this below.`);
  return { source: "trello", projectName: clip(board.name, 120), items, sprints: [], milestones: [], warnings };
}

// ---------------------------------------------------------------------------
// Quick Planner's own JSON export
// ---------------------------------------------------------------------------

export interface OwnExport {
  format: "quick-planner";
  version: number;
  project?: { name?: string };
  blueprint?: Blueprint;
  sprints?: ImportSprint[];
  milestones?: ParsedImport["milestones"];
  items?: ImportItem[];
}

const STATUSES: ItemStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];

export function parseOwnExport(data: OwnExport): ParsedImport {
  const warnings: string[] = [];
  if (data.version !== 1) warnings.push(`This export has version ${data.version}; importing what could be understood.`);
  const items = (data.items ?? []).filter((i) => i && typeof i.ref === "string" && typeof i.title === "string").map((i) => ({
    ...i,
    title: clip(i.title, IMPORT_LIMITS.title) ?? "Untitled",
    status: STATUSES.includes(i.status as ItemStatus) ? i.status : undefined,
  }));
  return {
    source: "quick-planner",
    projectName: clip(data.project?.name, 120),
    items,
    sprints: data.sprints ?? [],
    milestones: data.milestones ?? [],
    blueprint: data.blueprint,
    warnings,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export type ReadResult =
  | { kind: "parsed"; parsed: ParsedImport }
  | { kind: "csv"; rows: string[][]; headers: string[]; flavor: CsvFlavor; mapping: ColumnMapping }
  | { kind: "error"; message: string };

export function readImportFile(text: string): ReadResult {
  const trimmed = text.replace(/^﻿/, "").trim();
  if (!trimmed) return { kind: "error", message: "The file is empty." };
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    let data: unknown;
    try { data = JSON.parse(trimmed); } catch { return { kind: "error", message: "That file isn't valid JSON." }; }
    const obj = data as Record<string, unknown>;
    if (obj && obj.format === "quick-planner") return { kind: "parsed", parsed: parseOwnExport(obj as unknown as OwnExport) };
    if (obj && Array.isArray(obj.cards) && Array.isArray(obj.lists)) return { kind: "parsed", parsed: parseTrello(obj as TrelloBoard) };
    return { kind: "error", message: "This JSON isn't a Quick Planner or Trello export. Use a CSV file for other tools." };
  }
  const rows = parseCsv(trimmed);
  if (rows.length < 2) return { kind: "error", message: "The file needs a header row and at least one item." };
  const headers = rows[0].map((h) => h.trim());
  rows[0] = headers;
  const flavor = detectCsvFlavor(headers);
  return { kind: "csv", rows, headers, flavor, mapping: guessMapping(headers, flavor) };
}
