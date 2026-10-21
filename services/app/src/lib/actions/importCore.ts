// NOTE: deliberately NOT a "use server" file: these are internal helpers shared by the import actions and
// project creation. Marking it "use server" would expose each export as a publicly callable server action.

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { UserError, logHistoryEvent, type Db } from "./helpers";
import { blueprintProblem } from "@/lib/importer/templates";
import { guessStatus } from "@/lib/importer/normalize";
import { IMPORT_LIMITS, type Blueprint, type BlueprintField, type ImportItem, type ImportPlan, type ItemStatus } from "@/lib/importer/types";
import { POSITION_STEP } from "@/lib/order";

const STATUSES: ItemStatus[] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const PALETTE = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#db2777", "#0891b2", "#dc2626", "#65a30d"];
const SOURCE_LABEL: Record<string, string> = { "quick-planner": "a Quick Planner export", trello: "Trello", jira: "Jira", linear: "Linear", asana: "Asana", csv: "a CSV file" };

export interface ImportSummary {
  created: number;
  typesCreated: string[];
  sprintsCreated: number;
  milestonesCreated: number;
  links: number;
  dependencies: number;
  warnings: string[];
}

const key = (s: string) => s.trim().toLowerCase();
const toDate = (day: string | undefined) => (day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? new Date(`${day}T00:00:00.000Z`) : null);

/** Create the item types, fields and parent/child rules a blueprint describes, skipping what already exists. */
export async function applyBlueprint(tx: Db, ctx: { projectId: string; userId: string }, blueprint: Blueprint): Promise<string[]> {
  const problem = blueprintProblem(blueprint);
  if (problem) throw new UserError(problem);
  const existing = await tx.nodeType.findMany({ where: { projectId: ctx.projectId }, include: { fields: true } });
  const byName = new Map(existing.map((t) => [key(t.name), t]));
  const created: string[] = [];

  for (const t of blueprint.nodeTypes) {
    let type = byName.get(key(t.name));
    if (!type) {
      const row = await tx.nodeType.create({
        data: {
          name: t.name.trim(), color: t.color ?? PALETTE[byName.size % PALETTE.length], icon: t.icon ?? "Target",
          isSprintEligible: t.isSprintEligible ?? true, boardConfig: (t.boardConfig as Prisma.InputJsonValue | null) ?? undefined,
          userId: ctx.userId, projectId: ctx.projectId,
        },
        include: { fields: true },
      });
      byName.set(key(t.name), row);
      type = row;
      created.push(row.name);
    }
    const have = new Set(type.fields.map((f) => key(f.name)));
    for (const f of t.fields ?? []) {
      if (have.has(key(f.name))) continue;
      await tx.fieldDefinition.create({ data: { nodeTypeId: type.id, name: f.name.trim(), type: f.type, required: false, options: f.type === "SELECT" ? (f.options ?? []) : undefined } });
    }
  }
  for (const r of blueprint.relations) {
    const parent = byName.get(key(r.parent)), child = byName.get(key(r.child));
    if (!parent || !child) continue;
    await tx.allowedRelation.upsert({
      where: { parentNodeTypeId_childNodeTypeId: { parentNodeTypeId: parent.id, childNodeTypeId: child.id } },
      update: {}, create: { parentNodeTypeId: parent.id, childNodeTypeId: child.id },
    });
  }
  return created;
}

function checkPlan(plan: ImportPlan) {
  if (!plan || !Array.isArray(plan.items)) throw new UserError("Nothing to import");
  if (plan.items.length === 0) throw new UserError("The file doesn't contain any items");
  if (plan.items.length > IMPORT_LIMITS.items) throw new UserError(`You can import up to ${IMPORT_LIMITS.items} items at once. Split the file and import it in parts.`);
  if ((plan.sprints?.length ?? 0) > IMPORT_LIMITS.sprints) throw new UserError(`You can import up to ${IMPORT_LIMITS.sprints} sprints at once`);
  if ((plan.milestones?.length ?? 0) > IMPORT_LIMITS.milestones) throw new UserError(`You can import up to ${IMPORT_LIMITS.milestones} milestones at once`);
  const refs = new Set<string>();
  for (const item of plan.items) {
    if (!item || typeof item.ref !== "string" || typeof item.title !== "string" || !item.title.trim()) throw new UserError("Every item needs a title");
    if (refs.has(item.ref)) throw new UserError(`Two items share the id “${item.ref.slice(0, 40)}”`);
    refs.add(item.ref);
  }
}

/** The value as the field definition wants it, or undefined when it can't be used. */
function coerce(def: { type: string; options: unknown }, raw: string | number | boolean): string | number | boolean | undefined {
  switch (def.type) {
    case "NUMBER": { const n = typeof raw === "number" ? raw : Number(String(raw).replace(",", ".")); return Number.isFinite(n) ? n : undefined; }
    case "CHECKBOX": return typeof raw === "boolean" ? raw : /^(true|yes|y|1|x)$/i.test(String(raw));
    case "DATE": { const d = new Date(String(raw)); return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10); }
    case "SELECT": { const options = Array.isArray(def.options) ? (def.options as string[]) : []; return options.find((o) => key(o) === key(String(raw))); }
    default: return String(raw).slice(0, IMPORT_LIMITS.fieldValue);
  }
}

function inferFieldType(values: (string | number | boolean)[]): BlueprintField["type"] {
  if (values.every((v) => typeof v === "number")) return "NUMBER";
  if (values.every((v) => typeof v === "boolean")) return "CHECKBOX";
  return "TEXT";
}

/** Everything an import does, inside the caller's transaction. */
export async function runImport(tx: Db, ctx: { projectId: string; userId: string }, plan: ImportPlan): Promise<ImportSummary> {
  checkPlan(plan);
  const { projectId, userId } = ctx;
  const warnings: string[] = [];
  const typesCreated: string[] = plan.blueprint ? await applyBlueprint(tx, ctx, plan.blueprint) : [];

  // --- item types ---------------------------------------------------------
  const types = new Map((await tx.nodeType.findMany({ where: { projectId }, include: { fields: true } })).map((t) => [key(t.name), t]));
  const defaultName = plan.defaultType?.trim() || [...types.values()][0]?.name || "Task";
  const typeNameOf = (item: ImportItem) => (item.type?.trim() || defaultName).slice(0, 120);
  for (const item of plan.items) {
    const name = typeNameOf(item);
    if (types.has(key(name))) continue;
    const row = await tx.nodeType.create({ data: { name, color: PALETTE[types.size % PALETTE.length], icon: "Target", userId, projectId }, include: { fields: true } });
    types.set(key(name), row);
    typesCreated.push(row.name);
  }

  // --- hierarchy, cut where it would loop ---------------------------------
  const byRef = new Map(plan.items.map((i) => [i.ref, i]));
  const parentOf = new Map<string, string>();
  for (const item of plan.items) {
    if (item.parentRef && item.parentRef !== item.ref && byRef.has(item.parentRef)) parentOf.set(item.ref, item.parentRef);
  }
  let cut = 0;
  for (const item of plan.items) {
    const seen = new Set([item.ref]);
    for (let at = parentOf.get(item.ref); at; at = parentOf.get(at)) {
      if (seen.has(at)) { parentOf.delete(item.ref); cut++; break; }
      seen.add(at);
    }
  }
  if (cut > 0) warnings.push(`${cut} parent link${cut === 1 ? "" : "s"} would have formed a loop and ${cut === 1 ? "was" : "were"} skipped.`);

  // --- parent/child rules for every pair that now exists -------------------
  const pairs = new Set<string>();
  for (const [child, parent] of parentOf) {
    pairs.add(`${key(typeNameOf(byRef.get(parent)!))}|${key(typeNameOf(byRef.get(child)!))}`);
  }
  for (const pair of pairs) {
    const [p, c] = pair.split("|");
    const parentType = types.get(p)!, childType = types.get(c)!;
    await tx.allowedRelation.upsert({
      where: { parentNodeTypeId_childNodeTypeId: { parentNodeTypeId: parentType.id, childNodeTypeId: childType.id } },
      update: {}, create: { parentNodeTypeId: parentType.id, childNodeTypeId: childType.id },
    });
  }

  // --- custom fields ------------------------------------------------------
  const contentOf = new Map<string, Record<string, unknown>>();
  let droppedValues = 0;
  for (const [typeKey, type] of types) {
    const itemsOfType = plan.items.filter((i) => key(typeNameOf(i)) === typeKey && i.fields && Object.keys(i.fields).length > 0);
    if (itemsOfType.length === 0) continue;
    const names = [...new Set(itemsOfType.flatMap((i) => Object.keys(i.fields!)))];
    for (const name of names) {
      let def = type.fields.find((f) => key(f.name) === key(name));
      if (!def) {
        if (type.fields.length >= IMPORT_LIMITS.fieldsPerType) { droppedValues++; continue; }
        const values = itemsOfType.map((i) => i.fields![name]).filter((v) => v !== undefined);
        def = await tx.fieldDefinition.create({ data: { nodeTypeId: type.id, name: name.slice(0, 120), type: inferFieldType(values), required: false } });
        type.fields.push(def);
      }
      for (const item of itemsOfType) {
        const raw = item.fields![name];
        if (raw === undefined) continue;
        const value = coerce(def, raw);
        if (value === undefined) { droppedValues++; continue; }
        contentOf.set(item.ref, { ...(contentOf.get(item.ref) ?? {}), [def.name]: value });
      }
    }
  }
  if (droppedValues > 0) warnings.push(`${droppedValues} field value${droppedValues === 1 ? "" : "s"} didn't fit the field and ${droppedValues === 1 ? "was" : "were"} left out.`);

  // --- statuses ------------------------------------------------------------
  const statusOf = (item: ImportItem): ItemStatus => (item.status && STATUSES.includes(item.status) ? item.status : guessStatus(item.rawStatus) ?? "TODO");

  // --- sprints -------------------------------------------------------------
  const sprintRows = new Map((await tx.sprint.findMany({ where: { projectId } })).map((s) => [key(s.name), s]));
  const sprintNames = new Map<string, string>();
  for (const s of plan.sprints ?? []) if (s?.name?.trim()) sprintNames.set(key(s.name), s.name.trim().slice(0, 120));
  for (const item of plan.items) if (item.sprint?.trim()) sprintNames.set(key(item.sprint), item.sprint.trim().slice(0, 120));
  let sprintsCreated = 0;
  for (const [k, name] of sprintNames) {
    if (sprintRows.has(k)) continue;
    const spec = (plan.sprints ?? []).find((s) => key(s.name) === k);
    const inSprint = plan.items.filter((i) => i.sprint && key(i.sprint) === k && !i.archived);
    const finished = inSprint.length > 0 && inSprint.every((i) => statusOf(i) === "DONE");
    const status = spec?.status && ["PLANNED", "ACTIVE", "COMPLETED"].includes(spec.status) ? spec.status : finished ? "COMPLETED" : "PLANNED";
    const start = toDate(spec?.startDate), end = toDate(spec?.endDate);
    const row = await tx.sprint.create({
      data: { name, status, startDate: start, endDate: start && end && end < start ? null : end, capacity: typeof spec?.capacity === "number" && spec.capacity >= 0 ? spec.capacity : null, userId, projectId },
    });
    sprintRows.set(k, row);
    sprintsCreated++;
  }

  // --- people --------------------------------------------------------------
  const project = await tx.project.findUnique({ where: { id: projectId }, select: { user: { select: { id: true, email: true, name: true } }, members: { select: { user: { select: { id: true, email: true, name: true } } } } } });
  const people = [project?.user, ...(project?.members.map((m) => m.user) ?? [])].filter((u): u is { id: string; email: string | null; name: string | null } => !!u);
  const person = (label: string) => people.find((u) => (u.email && key(u.email) === key(label)) || (u.name && key(u.name) === key(label)))?.id ?? null;
  const unmatched = new Set<string>();

  // --- nodes ---------------------------------------------------------------
  const last = await tx.node.aggregate({ where: { projectId }, _max: { position: true } });
  const basePosition = (last._max.position ?? 0) + POSITION_STEP;
  const now = new Date();
  const idOf = new Map(plan.items.map((i) => [i.ref, randomUUID()]));
  const rows: Prisma.NodeCreateManyInput[] = plan.items.map((item, index) => {
    const status = statusOf(item);
    const start = toDate(item.startDate), end = toDate(item.endDate);
    const assigneeId = item.assignee ? person(item.assignee) : null;
    if (item.assignee && !assigneeId) unmatched.add(item.assignee);
    const content = contentOf.get(item.ref);
    return {
      id: idOf.get(item.ref)!,
      nodeTypeId: types.get(key(typeNameOf(item)))!.id,
      userId, projectId,
      title: item.title.trim().slice(0, IMPORT_LIMITS.title),
      description: item.description?.slice(0, IMPORT_LIMITS.description) || null,
      content: content ? (content as Prisma.InputJsonValue) : undefined,
      status,
      isArchived: !!item.archived,
      sprintId: item.sprint?.trim() ? sprintRows.get(key(item.sprint))?.id ?? null : null,
      assigneeId,
      position: basePosition + index * POSITION_STEP,
      startDate: start && end && end < start ? null : start,
      endDate: end,
      completedAt: status === "DONE" ? toDate(item.completedAt) ?? now : null,
    };
  });
  await tx.node.createMany({ data: rows });
  if (unmatched.size > 0) {
    const sample = [...unmatched].slice(0, 5).join(", ");
    warnings.push(`${unmatched.size} assignee${unmatched.size === 1 ? "" : "s"} (${sample}${unmatched.size > 5 ? ", …" : ""}) aren't members of this project, so those items were left unassigned. Invite them, or assign by hand.`);
  }

  // --- links ---------------------------------------------------------------
  const linkRows = [...parentOf].map(([child, parent]) => ({ parentNodeId: idOf.get(parent)!, childNodeId: idOf.get(child)! }));
  if (linkRows.length > 0) await tx.nodeLink.createMany({ data: linkRows, skipDuplicates: true });

  const blockers = new Map<string, Set<string>>(); // blocked -> blockers, for loop detection
  const depRows: { blockedNodeId: string; blockingNodeId: string }[] = [];
  const reaches = (from: string, to: string): boolean => {
    const stack = [from], seen = new Set<string>();
    while (stack.length) {
      const at = stack.pop()!;
      if (at === to) return true;
      if (seen.has(at)) continue;
      seen.add(at);
      for (const next of blockers.get(at) ?? []) stack.push(next);
    }
    return false;
  };
  let skippedDeps = 0;
  for (const item of plan.items) {
    for (const ref of item.blockedBy ?? []) {
      if (!byRef.has(ref) || ref === item.ref) continue;
      if (reaches(ref, item.ref)) { skippedDeps++; continue; }
      blockers.set(item.ref, (blockers.get(item.ref) ?? new Set()).add(ref));
      depRows.push({ blockedNodeId: idOf.get(item.ref)!, blockingNodeId: idOf.get(ref)! });
    }
  }
  if (depRows.length > 0) await tx.nodeDependency.createMany({ data: depRows, skipDuplicates: true });
  if (skippedDeps > 0) warnings.push(`${skippedDeps} dependenc${skippedDeps === 1 ? "y" : "ies"} would have formed a loop and ${skippedDeps === 1 ? "was" : "were"} skipped.`);

  // --- milestones ----------------------------------------------------------
  const milestones = (plan.milestones ?? []).filter((m) => m?.name?.trim() && toDate(m.date));
  if (milestones.length > 0) {
    await tx.milestone.createMany({
      data: milestones.map((m) => ({ projectId, name: m.name.trim().slice(0, 120), date: toDate(m.date)!, color: /^#[0-9a-fA-F]{6}$/.test(m.color ?? "") ? m.color! : "#f59e0b", description: m.description?.slice(0, 500) || null })),
    });
  }

  await logHistoryEvent({ projectId, action: "IMPORT", entityType: "PROJECT", entityName: `${rows.length} item${rows.length === 1 ? "" : "s"} from ${SOURCE_LABEL[plan.source] ?? "a file"}`, userId }, tx);
  return { created: rows.length, typesCreated, sprintsCreated, milestonesCreated: milestones.length, links: linkRows.length, dependencies: depRows.length, warnings };
}
