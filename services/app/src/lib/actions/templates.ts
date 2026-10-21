"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { cleanName, getProjectAccess, requireUserId, toResult, UserError, type ActionResult } from "./helpers";
import { buildBlueprint, buildOwnExport } from "./exportCore";
import { BUILT_IN_TEMPLATES, blueprintProblem, type TemplateConfig, type TemplateInfo } from "@/lib/importer/templates";
import type { Blueprint } from "@/lib/importer/types";

const MAX_TEMPLATES = 30;
const MAX_TEMPLATE_ITEMS = 300;

function summarize(blueprint: Blueprint): string {
  const names = blueprint.nodeTypes.map((t) => t.name);
  if (names.length === 0) return "Nothing yet";
  const children = new Set(blueprint.relations.map((r) => r.child));
  const roots = names.filter((n) => !children.has(n));
  return roots.length === names.length ? names.join(" · ") : `${roots.join(" · ")} → … (${names.length} types)`;
}

/** Built-in templates followed by the ones the signed-in person saved. */
export async function listTemplates(): Promise<TemplateInfo[]> {
  const userId = await requireUserId().catch(() => null);
  const mine = userId ? await prisma.projectTemplate.findMany({ where: { userId }, orderBy: { createdAt: "desc" } }) : [];
  return [
    ...BUILT_IN_TEMPLATES.map(({ config: _config, ...info }) => info),
    ...mine.map((t) => {
      const config = t.config as unknown as TemplateConfig;
      const items = config.items?.length ?? 0;
      return { id: t.id, name: t.name, description: t.description ?? "", summary: `${summarize(config.blueprint)}${items > 0 ? ` · ${items} starter item${items === 1 ? "" : "s"}` : ""}`, builtIn: false };
    }),
  ];
}

/** Keep a project's structure (item types, fields, rules) — and optionally its items — to start future projects from. */
export async function saveProjectAsTemplate(projectId: string, name: string, description: string, includeItems: boolean): Promise<ActionResult & { id?: string }> {
  const userId = await requireUserId();
  let id: string | undefined;
  const result = await toResult(async () => {
    if (!(await getProjectAccess(projectId))) throw new UserError("Project not found");
    const cleaned = cleanName(name, "Template name");
    if ((await prisma.projectTemplate.count({ where: { userId } })) >= MAX_TEMPLATES) throw new UserError(`You can keep up to ${MAX_TEMPLATES} templates. Delete one first.`);
    const blueprint = await buildBlueprint(projectId);
    const problem = blueprintProblem(blueprint);
    if (problem) throw new UserError(problem);

    const config: TemplateConfig = { blueprint };
    if (includeItems) {
      const data = await buildOwnExport(projectId);
      const items = (data?.items ?? []).filter((i) => !i.archived);
      if (items.length > MAX_TEMPLATE_ITEMS) throw new UserError(`A template can hold up to ${MAX_TEMPLATE_ITEMS} items. This project has ${items.length}.`);
      // A template starts fresh: structure and wording only, no people, dates, sprints or progress.
      config.items = items.map((i) => ({ ref: i.ref, title: i.title, ...(i.description ? { description: i.description } : {}), ...(i.type ? { type: i.type } : {}), ...(i.parentRef ? { parentRef: i.parentRef } : {}), ...(i.fields ? { fields: i.fields } : {}) }));
    }
    const created = await prisma.projectTemplate.create({ data: { userId, name: cleaned, description: description.trim().slice(0, 300) || null, config: config as unknown as object } });
    id = created.id;
  });
  return { ...result, id };
}

export async function deleteTemplate(id: string): Promise<ActionResult> {
  const userId = await requireUserId();
  const result = await toResult(async () => {
    await prisma.projectTemplate.deleteMany({ where: { id, userId } });
  });
  if (!result.error) revalidatePath("/projects");
  return result;
}
