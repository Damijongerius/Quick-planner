"use server";

import prisma from "@/lib/db";
import { isViewPage, pickViewQuery } from "@/lib/urlState";
import { UserError, cleanName, getProjectAccess, toResult, type ActionResult } from "./helpers";

const MAX_VIEWS_PER_USER = 30;

export type ViewInfo = { id: string; name: string; page: string; query: string; shared: boolean; mine: boolean; ownerName: string | null };

export async function getSavedViews(projectId: string, page: string): Promise<ViewInfo[]> {
  const access = await getProjectAccess(projectId);
  if (!access || !isViewPage(page)) return [];
  const views = await prisma.savedView.findMany({
    where: { projectId, page, OR: [{ shared: true }, { userId: access.userId }] },
    orderBy: [{ shared: "asc" }, { name: "asc" }],
    include: { user: { select: { name: true, email: true } } },
  });
  return views.map((v) => ({
    id: v.id, name: v.name, page: v.page, query: v.query, shared: v.shared,
    mine: v.userId === access.userId, ownerName: v.user.name || v.user.email,
  }));
}

/** Personal views are open to every member (including viewers); sharing one with the team needs edit access. */
export async function createSavedView(projectId: string, input: { name: string; page: string; query: string; shared: boolean }): Promise<ActionResult> {
  return toResult(async () => {
    const access = await getProjectAccess(projectId);
    if (!access) throw new UserError("Project not found");
    if (!isViewPage(input.page)) throw new UserError("Unknown page");
    if (input.shared && access.role === "VIEWER") throw new UserError("Viewers can only save personal views");
    const name = cleanName(input.name, "View name");
    const query = pickViewQuery(input.query, input.page);
    if (!query) throw new UserError("Set at least one filter first, then save the view");
    const count = await prisma.savedView.count({ where: { projectId, userId: access.userId } });
    if (count >= MAX_VIEWS_PER_USER) throw new UserError("You have too many saved views. Delete some first.");
    await prisma.savedView.create({ data: { projectId, userId: access.userId, name, page: input.page, query, shared: input.shared } });
  });
}

export async function deleteSavedView(projectId: string, id: string): Promise<ActionResult> {
  const access = await getProjectAccess(projectId);
  if (!access) return { error: "Project not found" };
  const view = await prisma.savedView.findFirst({ where: { id, projectId }, select: { userId: true } });
  if (!view) return {};
  if (view.userId !== access.userId && access.role !== "OWNER") return { error: "You can only delete your own views" };
  await prisma.savedView.delete({ where: { id } });
  return {};
}
