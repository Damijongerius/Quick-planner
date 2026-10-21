// NOTE: deliberately NOT a "use server" file. Everything exported here is an
// internal helper; marking it "use server" would expose each export as a
// publicly callable server action.

import { Prisma } from "@prisma/client";
import prisma from "@/lib/db";
import { currentUserId, isReadOnlyToken } from "./context";
import { sanitizeContent, type FieldRow } from "@/lib/validation";
import { isReachable, collectDescendants } from "@/lib/graph";
import { deriveParentStatus, completedAtFor } from "@/lib/status";
import { UserError, type ActionResult } from "@/lib/errors";
import { canEdit, canManage, isProjectRole, type ProjectRole } from "@/lib/roles";

export { cleanTitle, cleanName, assertNodeStatus, parseDate } from "@/lib/validation";

export type Db = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Authorization
// ---------------------------------------------------------------------------

export async function requireUserId(): Promise<string> {
    const userId = await currentUserId();
    if (!userId) throw new Error("Unauthorized");
    return userId;
}

export type ProjectAccess = { userId: string; role: ProjectRole; isArchived: boolean };

/** The signed-in user's role in the project (owner or member), or null when they have no access. */
export async function getProjectAccess(projectId: string): Promise<ProjectAccess | null> {
    const userId = await currentUserId();
    if (!userId) return null;
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true, isArchived: true, members: { where: { userId }, select: { role: true } } },
    });
    if (!project) return null;
    const role = project.userId === userId ? "OWNER" : project.members[0]?.role;
    if (!isProjectRole(role)) return null;
    return { userId, role, isArchived: project.isArchived };
}

/** User id if they may at least read the project, otherwise null. For read paths that degrade to "empty". */
export async function getProjectViewerId(projectId: string): Promise<string | null> {
    return (await getProjectAccess(projectId))?.userId ?? null;
}

/** Prisma filter for "projects this user owns or is a member of". */
export function accessibleBy(userId: string) {
    return { OR: [{ userId }, { members: { some: { userId } } }] };
}

export type AccessMode = "read" | "comment" | "edit" | "owner";

/**
 * Throws unless the signed-in user may do `mode` in the project; returns their user id.
 *  - read   : any member (works on archived projects)
 *  - comment: any member, project must not be archived
 *  - edit   : owner/editor, project must not be archived (default)
 *  - owner  : the owner only (works on archived projects, so it can be restored)
 */
export async function requireProjectAccess(projectId: string, { mode = "edit" }: { mode?: AccessMode } = {}): Promise<string> {
    const userId = await requireUserId();
    if (mode !== "read" && isReadOnlyToken()) throw new UserError("This API token is read-only");
    const access = await getProjectAccess(projectId);
    if (!access) throw new Error("Project not found");
    if (mode === "owner" && !canManage(access.role)) throw new Error("Only the project owner can do this");
    if (mode === "edit" && !canEdit(access.role)) throw new Error("You have view-only access to this project");
    if ((mode === "edit" || mode === "comment") && access.isArchived) throw new Error("Cannot modify a decommissioned project");
    return userId;
}

export { UserError, type ActionResult };

export async function toResult(fn: () => Promise<unknown>): Promise<ActionResult> {
    try {
        await fn();
        return {};
    } catch (error) {
        if (error instanceof UserError) return { error: error.message };
        throw error;
    }
}

// ---------------------------------------------------------------------------
// Input validation (pure parts live in @/lib/validation)
// ---------------------------------------------------------------------------

export async function validateNodeContent(
    db: Db,
    nodeTypeId: string,
    content: Record<string, unknown> | undefined | null,
    options: { partial?: boolean } = {}
): Promise<Record<string, unknown>> {
    const fields: FieldRow[] = await db.fieldDefinition.findMany({
        where: { nodeTypeId },
        select: { name: true, type: true, required: true, options: true }
    });
    return sanitizeContent(fields, content, options);
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------

export async function logHistoryEvent({
    projectId,
    nodeId,
    action,
    entityType,
    entityName,
    oldValue,
    newValue,
    userId
}: {
    projectId: string;
    nodeId?: string;
    action: string;
    entityType: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
    userId?: string;
}, db: Db = prisma) {
    const actingUserId = userId ?? (await currentUserId());
    if (!actingUserId) return;

    await db.historyEvent.create({
        data: {
            userId: actingUserId,
            projectId,
            nodeId,
            action,
            entityType,
            entityName,
            oldValue,
            newValue
        }
    });
}

// ---------------------------------------------------------------------------
// Graph helpers (traversal logic itself lives in @/lib/graph)
// ---------------------------------------------------------------------------

/** True if making `newParentId` the parent of `nodeId` would create a loop. */
export async function wouldCreateParentCycle(db: Db, nodeId: string, newParentId: string): Promise<boolean> {
    // Walk up from the proposed parent; meeting `nodeId` on the way means it is already an ancestor.
    return isReachable(newParentId, nodeId, async (ids) => {
        const links = await db.nodeLink.findMany({ where: { childNodeId: { in: ids } }, select: { parentNodeId: true } });
        return links.map(l => l.parentNodeId);
    });
}

/** True if `blockingNodeId` already (transitively) depends on `blockedNodeId`. */
export async function wouldCreateDependencyCycle(db: Db, blockedNodeId: string, blockingNodeId: string): Promise<boolean> {
    return isReachable(blockedNodeId, blockingNodeId, async (ids) => {
        const deps = await db.nodeDependency.findMany({ where: { blockingNodeId: { in: ids } }, select: { blockedNodeId: true } });
        return deps.map(d => d.blockedNodeId);
    });
}

/**
 * Descendants of `rootId`, one query per tree level.
 * `include` decides whether a child (and therefore its subtree) is followed.
 */
export async function collectDescendantIds(
    db: Db,
    projectId: string,
    rootId: string,
    include: (child: { status: string; isArchived: boolean }) => boolean = () => true
): Promise<string[]> {
    return collectDescendants<{ id: string; status: string; isArchived: boolean }>(
        rootId,
        async (parentIds) => {
            const links = await db.nodeLink.findMany({
                where: { parentNodeId: { in: parentIds }, childNode: { projectId } },
                select: { childNodeId: true, childNode: { select: { status: true, isArchived: true } } }
            });
            return links.map(l => ({ id: l.childNodeId, ...l.childNode }));
        },
        include
    );
}

// ---------------------------------------------------------------------------
// Propagation
// ---------------------------------------------------------------------------

/**
 * Re-derives the status of each ancestor of `nodeId` from its children:
 *  - every (non-archived) child DONE  -> parent DONE
 *  - otherwise a DONE parent reopens  -> IN_PROGRESS
 *  - a TODO parent with any started child -> IN_PROGRESS
 * Works for status changes in either direction, new children and re-parenting.
 */
export async function propagateStatusUpwards(projectId: string, nodeId: string, userId?: string, db: Db = prisma) {
    const links = await db.nodeLink.findMany({ where: { childNodeId: nodeId }, select: { parentNodeId: true } });
    await reconcileParentStatuses(projectId, links.map(l => l.parentNodeId), userId, db, nodeId);
}

/** Same as above, for when the child is gone or detached and only the old parents are known. */
export async function reconcileParentStatuses(
    projectId: string,
    parentIds: string[],
    userId?: string,
    db: Db = prisma,
    startNodeId?: string
) {
    const visited = new Set<string>(startNodeId ? [startNodeId] : []);
    let frontier = parentIds.filter((id, i) => parentIds.indexOf(id) === i);

    while (frontier.length > 0) {
        const next: string[] = [];

        for (const parentId of frontier) {
            if (visited.has(parentId)) continue;
            visited.add(parentId);

            const parent = await db.node.findUnique({ where: { id: parentId }, select: { id: true, title: true, status: true } });
            if (!parent) continue;

            const children = await db.nodeLink.findMany({
                where: { parentNodeId: parent.id, childNode: { isArchived: false } },
                select: { childNode: { select: { status: true } } }
            });
            if (children.length === 0) continue;

            const target = deriveParentStatus(parent.status, children.map(c => c.childNode.status));
            if (!target) continue;

            await db.node.update({ where: { id: parent.id }, data: { status: target, completedAt: completedAtFor(parent.status, target) } });
            await logHistoryEvent({
                projectId,
                nodeId: parent.id,
                action: "STATUS_CHANGE",
                entityType: "NODE",
                entityName: parent.title,
                oldValue: parent.status,
                newValue: `${target} (Auto)`,
                userId
            }, db);

            const grandparents = await db.nodeLink.findMany({ where: { childNodeId: parent.id }, select: { parentNodeId: true } });
            next.push(...grandparents.map(g => g.parentNodeId));
        }
        frontier = next;
    }
}

/** Pushes dependent nodes so they start the day after their blocker ends. */
export async function propagateTimelineShift(projectId: string, nodeId: string, userId?: string, db: Db = prisma) {
    const visited = new Set<string>();
    const queue = [nodeId];

    while (queue.length > 0) {
        const currentId = queue.shift() as string;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const currentNode = await db.node.findUnique({
            where: { id: currentId },
            include: { blocking: { include: { blockedNode: true } } }
        });
        if (!currentNode?.endDate) continue;

        for (const dep of currentNode.blocking) {
            const blockedNode = dep.blockedNode;
            if (!blockedNode.startDate || !blockedNode.endDate) continue;

            const duration = blockedNode.endDate.getTime() - blockedNode.startDate.getTime();
            const newStart = new Date(currentNode.endDate);
            newStart.setDate(newStart.getDate() + 1);
            newStart.setHours(0, 0, 0, 0);
            const newEnd = new Date(newStart.getTime() + duration);

            if (blockedNode.startDate.getTime() === newStart.getTime()) continue;

            await db.node.update({
                where: { id: blockedNode.id },
                data: { startDate: newStart, endDate: newEnd }
            });
            await logHistoryEvent({
                projectId,
                nodeId: blockedNode.id,
                action: "UPDATE",
                entityType: "NODE",
                entityName: blockedNode.title,
                oldValue: "Timeline shifted",
                newValue: `Starts ${newStart.toISOString().slice(0, 10)} (Auto)`,
                userId
            }, db);
            queue.push(blockedNode.id);
        }
    }
}
