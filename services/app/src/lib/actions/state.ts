"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { logHistoryEvent, propagateStatusUpwards } from "./helpers";

export async function updateNodeStatus(projectId: string, id: string, status: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const oldNode = await prisma.node.findUnique({ where: { id } });
  await prisma.node.update({ where: { id, userId: session.user.id, projectId }, data: { status }, });
  await propagateStatusUpwards(projectId, id, status);
  await logHistoryEvent({ projectId, nodeId: id, action: 'STATUS_CHANGE', entityType: 'NODE', entityName: oldNode?.title, oldValue: oldNode?.status, newValue: status });
  revalidatePath(`/project/${projectId}/board`);
  revalidatePath(`/project/${projectId}/backlog`);
}
