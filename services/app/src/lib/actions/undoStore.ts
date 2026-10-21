// Server-side helpers for "Undo delete". Not a "use server" file: only imported by action modules.

import type { Prisma } from "@prisma/client";
import type { Db } from "./helpers";

export const UNDO_WINDOW_MS = 10 * 60 * 1000;

type NodeRow = {
  id: string; nodeTypeId: string; userId: string; title: string; description: string | null; content: unknown;
  status: string; isArchived: boolean; sprintId: string | null; assigneeId: string | null; position: number;
  completedAt: string | null; startDate: string | null; endDate: string | null; createdAt: string;
};

export type NodeSnapshot = {
  node: NodeRow;
  parents: string[];
  children: string[];
  blockedBy: string[];
  blocking: string[];
  comments: { id: string; userId: string; body: string; createdAt: string }[];
  watchers: string[];
};

const iso = (d: Date | null) => (d ? d.toISOString() : null);

/** Capture everything needed to bring these items back exactly as they were. */
export async function snapshotNodes(db: Db, projectId: string, ids: string[]): Promise<NodeSnapshot[]> {
  const nodes = await db.node.findMany({
    where: { id: { in: ids }, projectId },
    include: {
      parentLinks: { select: { parentNodeId: true } },
      childLinks: { select: { childNodeId: true } },
      blockedBy: { select: { blockingNodeId: true } },
      blocking: { select: { blockedNodeId: true } },
      comments: { select: { id: true, userId: true, body: true, createdAt: true } },
      watchers: { select: { userId: true } },
    },
  });
  return nodes.map((n) => ({
    node: {
      id: n.id, nodeTypeId: n.nodeTypeId, userId: n.userId, title: n.title, description: n.description, content: n.content,
      status: n.status, isArchived: n.isArchived, sprintId: n.sprintId, assigneeId: n.assigneeId, position: n.position,
      completedAt: iso(n.completedAt), startDate: iso(n.startDate), endDate: iso(n.endDate), createdAt: n.createdAt.toISOString(),
    },
    parents: n.parentLinks.map((l) => l.parentNodeId),
    children: n.childLinks.map((l) => l.childNodeId),
    blockedBy: n.blockedBy.map((d) => d.blockingNodeId),
    blocking: n.blocking.map((d) => d.blockedNodeId),
    comments: n.comments.map((c) => ({ id: c.id, userId: c.userId, body: c.body, createdAt: c.createdAt.toISOString() })),
    watchers: n.watchers.map((w) => w.userId),
  }));
}

/** Re-create snapshotted items. Anything that references something that no longer exists is quietly dropped. */
export async function restoreSnapshots(db: Db, projectId: string, snapshots: NodeSnapshot[]): Promise<number> {
  let restored = 0;
  const typeIds = new Set((await db.nodeType.findMany({ where: { projectId }, select: { id: true } })).map((t) => t.id));
  const sprintIds = new Set((await db.sprint.findMany({ where: { projectId }, select: { id: true } })).map((s) => s.id));
  const people = new Set([
    ...(await db.projectMember.findMany({ where: { projectId }, select: { userId: true } })).map((m) => m.userId),
    (await db.project.findUnique({ where: { id: projectId }, select: { userId: true } }))?.userId ?? "",
  ]);

  const created: string[] = [];
  for (const snap of snapshots) {
    const n = snap.node;
    if (!typeIds.has(n.nodeTypeId)) continue;
    if (await db.node.findUnique({ where: { id: n.id }, select: { id: true } })) continue;
    await db.node.create({
      data: {
        id: n.id, projectId, nodeTypeId: n.nodeTypeId, userId: people.has(n.userId) ? n.userId : [...people][0], title: n.title,
        description: n.description, content: (n.content ?? undefined) as Prisma.InputJsonValue | undefined, status: n.status, isArchived: n.isArchived,
        sprintId: n.sprintId && sprintIds.has(n.sprintId) ? n.sprintId : null,
        assigneeId: n.assigneeId && people.has(n.assigneeId) ? n.assigneeId : null,
        position: n.position,
        completedAt: n.completedAt ? new Date(n.completedAt) : null,
        startDate: n.startDate ? new Date(n.startDate) : null,
        endDate: n.endDate ? new Date(n.endDate) : null,
        createdAt: new Date(n.createdAt),
      },
    });
    created.push(n.id);
    restored++;
  }

  const alive = async (ids: string[]) => new Set((await db.node.findMany({ where: { id: { in: ids }, projectId }, select: { id: true } })).map((x) => x.id));
  for (const snap of snapshots) {
    if (!created.includes(snap.node.id)) continue;
    const id = snap.node.id;
    const others = await alive([...snap.parents, ...snap.children, ...snap.blockedBy, ...snap.blocking]);
    await db.nodeLink.createMany({
      data: [
        ...snap.parents.filter((p) => others.has(p)).map((p) => ({ parentNodeId: p, childNodeId: id })),
        ...snap.children.filter((c) => others.has(c)).map((c) => ({ parentNodeId: id, childNodeId: c })),
      ],
      skipDuplicates: true,
    });
    await db.nodeDependency.createMany({
      data: [
        ...snap.blockedBy.filter((b) => others.has(b)).map((b) => ({ blockedNodeId: id, blockingNodeId: b })),
        ...snap.blocking.filter((b) => others.has(b)).map((b) => ({ blockedNodeId: b, blockingNodeId: id })),
      ],
      skipDuplicates: true,
    });
    const users = new Set((await db.user.findMany({ where: { id: { in: [...snap.comments.map((c) => c.userId), ...snap.watchers] } }, select: { id: true } })).map((u) => u.id));
    if (snap.comments.length) {
      await db.comment.createMany({
        data: snap.comments.filter((c) => users.has(c.userId)).map((c) => ({ id: c.id, nodeId: id, userId: c.userId, body: c.body, createdAt: new Date(c.createdAt) })),
        skipDuplicates: true,
      });
    }
    if (snap.watchers.length) {
      await db.nodeWatcher.createMany({ data: snap.watchers.filter((u) => users.has(u)).map((userId) => ({ nodeId: id, userId })), skipDuplicates: true });
    }
  }
  return restored;
}
