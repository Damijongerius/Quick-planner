import { Prisma } from "@prisma/client";
import { appBaseUrl } from "@/lib/mail/config";

export const ITEM_INCLUDE = {
  type: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true, email: true } },
  parentLinks: { select: { parentNodeId: true }, take: 1 },
  blockedBy: { select: { blockingNodeId: true } },
} satisfies Prisma.NodeInclude;

type Row = Prisma.NodeGetPayload<{ include: typeof ITEM_INCLUDE }>;

/** The public shape of an item: stable names, ISO dates, no internal columns. */
export function toApiItem(n: Row) {
  return {
    id: n.id,
    projectId: n.projectId,
    title: n.title,
    description: n.description,
    type: n.type,
    status: n.status,
    archived: n.isArchived,
    parentId: n.parentLinks[0]?.parentNodeId ?? null,
    sprintId: n.sprintId,
    assignee: n.assignee,
    startDate: n.startDate ? n.startDate.toISOString().slice(0, 10) : null,
    endDate: n.endDate ? n.endDate.toISOString().slice(0, 10) : null,
    completedAt: n.completedAt?.toISOString() ?? null,
    fields: (n.content as Record<string, unknown> | null) ?? {},
    blockedBy: n.blockedBy.map((b) => b.blockingNodeId),
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    url: `${appBaseUrl()}/project/${n.projectId}/backlog?nodeId=${n.id}`,
  };
}
