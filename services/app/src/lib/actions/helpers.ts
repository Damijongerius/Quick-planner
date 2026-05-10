"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";

// Internal Helper for History Logging
export async function logHistoryEvent({
    projectId,
    nodeId,
    action,
    entityType,
    entityName,
    oldValue,
    newValue
}: {
    projectId: string;
    nodeId?: string;
    action: string;
    entityType: string;
    entityName?: string;
    oldValue?: string;
    newValue?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return;

    await prisma.historyEvent.create({
        data: {
            userId: session.user.id,
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

// Internal Helper for Status Propagation
export async function propagateStatusUpwards(projectId: string, nodeId: string, newStatus: string) {
    if (newStatus !== 'IN_PROGRESS' && newStatus !== 'DONE') return;

    const links = await prisma.nodeLink.findMany({
        where: { childNodeId: nodeId },
        include: { parentNode: true }
    });

    for (const link of links) {
        const parent = link.parentNode;
        
        if (newStatus === 'IN_PROGRESS') {
            if (parent.status === 'TODO') {
                await prisma.node.update({
                    where: { id: parent.id },
                    data: { status: 'IN_PROGRESS' }
                });
                await logHistoryEvent({ projectId, nodeId: parent.id, action: 'STATUS_CHANGE', entityType: 'NODE', entityName: parent.title, oldValue: 'TODO', newValue: 'IN_PROGRESS (Auto)' });
                await propagateStatusUpwards(projectId, parent.id, 'IN_PROGRESS');
            }
        } else if (newStatus === 'DONE') {
            const siblings = await prisma.nodeLink.findMany({
                where: { parentNodeId: parent.id },
                include: { childNode: true }
            });
            const allDone = siblings.every((s: any) => s.childNode.status === 'DONE');
            if (allDone && parent.status !== 'DONE') {
                await prisma.node.update({
                    where: { id: parent.id },
                    data: { status: 'DONE' }
                });
                await logHistoryEvent({ projectId, nodeId: parent.id, action: 'STATUS_CHANGE', entityType: 'NODE', entityName: parent.title, oldValue: parent.status, newValue: 'DONE (Auto)' });
                await propagateStatusUpwards(projectId, parent.id, 'DONE');
            }
        }
    }
}

// Internal Helper for Dynamic Timeline Propagation
export async function propagateTimelineShift(projectId: string, nodeId: string) {
    const currentNode = await prisma.node.findUnique({
        where: { id: nodeId },
        include: { blocking: { include: { blockedNode: true } } }
    });

    if (!currentNode || !currentNode.endDate) return;

    for (const dep of currentNode.blocking) {
        const blockedNode = dep.blockedNode;
        if (!blockedNode.startDate || !blockedNode.endDate) continue;

        const duration = blockedNode.endDate.getTime() - blockedNode.startDate.getTime();
        const newStart = new Date(currentNode.endDate);
        newStart.setDate(newStart.getDate() + 1);
        newStart.setHours(0, 0, 0, 0);

        const newEnd = new Date(newStart.getTime() + duration);

        if (blockedNode.startDate.getTime() !== newStart.getTime()) {
            await prisma.node.update({
                where: { id: blockedNode.id },
                data: { 
                    startDate: newStart,
                    endDate: newEnd
                }
            });

            await logHistoryEvent({
                projectId,
                nodeId: blockedNode.id,
                action: 'UPDATE',
                entityType: 'NODE',
                entityName: blockedNode.title,
                oldValue: 'Timeline shifted',
                newValue: `Starts ${newStart.toLocaleDateString()} (Auto)`
            });

            await propagateTimelineShift(projectId, blockedNode.id);
        }
    }
}
