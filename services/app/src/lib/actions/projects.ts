"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { serializeData } from "@/lib/utils";
import { logHistoryEvent } from "./helpers";
import { Project } from "@/lib/types";

export async function getProjects(): Promise<Project[]> {
  const session = await auth();
  if (!session?.user?.id) return [];
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return serializeData(projects) as Project[];
}

export async function getProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) return null;
  const project = await prisma.project.findUnique({
    where: { id, userId: session.user.id },
  });
  return serializeData(project);
}

export async function createProject(name: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  const project = await prisma.project.create({
    data: { name, userId },
  });
  await logHistoryEvent({ projectId: project.id, action: 'CREATE', entityType: 'PROJECT', entityName: name });
  revalidatePath("/projects");
  return serializeData(project);
}

export async function deleteProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.project.delete({ where: { id, userId: session.user.id } });
  revalidatePath("/projects");
}

export async function archiveProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.project.update({
    where: { id, userId: session.user.id },
    data: { isArchived: true }
  });
  revalidatePath("/projects");
}

export async function unarchiveProject(id: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.project.update({
    where: { id, userId: session.user.id },
    data: { isArchived: false }
  });
  revalidatePath("/projects");
}

export async function getProjectHistory(projectId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];
    const history = await prisma.historyEvent.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, image: true } } },
        take: 100
    });
    return serializeData(history);
}

export async function getHistoryForNode(projectId: string, nodeId: string) {
    const session = await auth();
    if (!session?.user?.id) return [];
    const history = await prisma.historyEvent.findMany({
        where: { projectId, nodeId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, image: true } } }
    });
    return serializeData(history);
}
