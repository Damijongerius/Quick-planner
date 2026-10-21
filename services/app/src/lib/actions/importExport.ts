"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { publishChange } from "@/lib/realtime/hub";
import { cleanName, requireProjectAccess, requireUserId, toResult, type ActionResult } from "./helpers";
import { runImport, type ImportSummary } from "./importCore";
import type { ImportPlan } from "@/lib/importer/types";

export type ImportResult = ActionResult & { summary?: ImportSummary; projectId?: string };

function announce(projectId: string, userId: string) {
  for (const page of ["backlog", "board", "timeline", "sprints", "planning", "reports", "history", "settings/nodes"]) revalidatePath(`/project/${projectId}/${page}`);
  for (const scope of ["nodes", "types", "sprints", "milestones"] as const) publishChange(projectId, scope, userId);
}

/** Add the items of a parsed file to an existing project. Everything happens in one transaction: it all lands or none of it does. */
export async function importItems(projectId: string, plan: ImportPlan): Promise<ImportResult> {
  const userId = await requireProjectAccess(projectId);
  let summary: ImportSummary | undefined;
  const result = await toResult(async () => {
    summary = await prisma.$transaction((tx) => runImport(tx, { projectId, userId }, plan), { timeout: 60_000, maxWait: 10_000 });
  });
  if (!result.error) announce(projectId, userId);
  return { ...result, summary };
}

/** Start a new project from a file. */
export async function importAsNewProject(name: string, plan: ImportPlan): Promise<ImportResult> {
  const userId = await requireUserId();
  let summary: ImportSummary | undefined;
  let projectId: string | undefined;
  const result = await toResult(async () => {
    const cleaned = cleanName(name, "Project name");
    const out = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({ data: { name: cleaned, userId } });
      return { id: project.id, summary: await runImport(tx, { projectId: project.id, userId }, plan) };
    }, { timeout: 60_000, maxWait: 10_000 });
    projectId = out.id;
    summary = out.summary;
  });
  if (!result.error) revalidatePath("/projects");
  return { ...result, summary, projectId };
}
