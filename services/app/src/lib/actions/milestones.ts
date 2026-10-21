"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { publishChange } from "@/lib/realtime/hub";
import { serializeData } from "@/lib/utils";
import { UserError, cleanName, getProjectViewerId, logHistoryEvent, parseDate, requireProjectAccess, toResult, type ActionResult } from "./helpers";

export type MilestoneInfo = { id: string; name: string; date: string; color: string; description: string | null };

const COLOR = /^#[0-9a-fA-F]{6}$/;
const MAX_MILESTONES = 100;

function clean(input: { name?: string; date?: string; color?: string; description?: string | null }, partial: boolean) {
  const data: { name?: string; date?: Date; color?: string; description?: string | null } = {};
  if (!partial || input.name !== undefined) data.name = cleanName(input.name, "Milestone name");
  if (!partial || input.date !== undefined) {
    const date = parseDate(input.date, "date");
    if (!date) throw new UserError("Pick a date for the milestone");
    data.date = date;
  }
  if (input.color !== undefined) {
    if (!COLOR.test(input.color)) throw new UserError("Colour must look like #f59e0b");
    data.color = input.color;
  }
  if (input.description !== undefined) {
    const text = typeof input.description === "string" ? input.description.trim() : "";
    if (text.length > 500) throw new UserError("Keep the description under 500 characters");
    data.description = text || null;
  }
  return data;
}

export async function getMilestones(projectId: string): Promise<MilestoneInfo[]> {
  if (!(await getProjectViewerId(projectId))) return [];
  const rows = await prisma.milestone.findMany({ where: { projectId }, orderBy: { date: "asc" } });
  return serializeData(rows.map((m) => ({ id: m.id, name: m.name, date: m.date as unknown as string, color: m.color, description: m.description })));
}

function touch(projectId: string, userId: string) {
  revalidatePath(`/project/${projectId}/timeline`);
  publishChange(projectId, "milestones", userId);
}

export async function createMilestone(projectId: string, input: { name: string; date: string; color?: string; description?: string }): Promise<ActionResult & { id?: string }> {
  const userId = await requireProjectAccess(projectId);
  let id: string | undefined;
  const result = await toResult(async () => {
    const data = clean(input, false);
    if ((await prisma.milestone.count({ where: { projectId } })) >= MAX_MILESTONES) throw new UserError(`A project can have up to ${MAX_MILESTONES} milestones`);
    const created = await prisma.milestone.create({ data: { projectId, name: data.name!, date: data.date!, color: data.color, description: data.description } });
    id = created.id;
    await logHistoryEvent({ projectId, action: "CREATE", entityType: "MILESTONE", entityName: created.name, userId });
  });
  if (!result.error) touch(projectId, userId);
  return { ...result, id };
}

export async function updateMilestone(projectId: string, id: string, input: { name?: string; date?: string; color?: string; description?: string | null }): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);
  const result = await toResult(async () => {
    const existing = await prisma.milestone.findFirst({ where: { id, projectId } });
    if (!existing) throw new UserError("This milestone no longer exists");
    const data = clean(input, true);
    if (Object.keys(data).length === 0) return;
    await prisma.milestone.update({ where: { id }, data });
    await logHistoryEvent({ projectId, action: "UPDATE", entityType: "MILESTONE", entityName: data.name ?? existing.name, oldValue: data.name && data.name !== existing.name ? existing.name : undefined, newValue: data.name && data.name !== existing.name ? data.name : undefined, userId });
  });
  if (!result.error) touch(projectId, userId);
  return result;
}

export async function deleteMilestone(projectId: string, id: string): Promise<ActionResult> {
  const userId = await requireProjectAccess(projectId);
  const result = await toResult(async () => {
    const existing = await prisma.milestone.findFirst({ where: { id, projectId } });
    if (!existing) return;
    await prisma.milestone.delete({ where: { id } });
    await logHistoryEvent({ projectId, action: "DELETE", entityType: "MILESTONE", entityName: existing.name, userId });
  });
  if (!result.error) touch(projectId, userId);
  return result;
}
