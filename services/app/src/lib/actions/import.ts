"use server";

import prisma from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function importProjectData(projectId: string, data: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const { nodeTypes = [], relations = [], nodes = [], sprints = [] } = data;

    // 1. Create/Update Node Types
    const typeMap = new Map<string, string>(); // name -> id
    
    const existingTypes = await prisma.nodeType.findMany({ where: { projectId } });
    existingTypes.forEach((t: any) => typeMap.set(t.name, t.id));

    for (const nt of nodeTypes) {
        let typeId = typeMap.get(nt.name);
        if (!typeId) {
            const created = await prisma.nodeType.create({
                data: {
                    name: nt.name,
                    color: nt.color || "#3b82f6",
                    icon: nt.icon || "Target",
                    userId: session.user.id,
                    projectId,
                    fields: {
                        create: (nt.fields || []).map((f: any) => ({
                            name: f.name,
                            type: f.type || "TEXT"
                        }))
                    }
                }
            });
            typeId = created.id;
            typeMap.set(nt.name, created.id);
        }
    }

    // 2. Create Relations
    for (const rel of relations) {
        const parentId = typeMap.get(rel.parent);
        const childId = typeMap.get(rel.child);
        if (parentId && childId) {
            await prisma.allowedRelation.upsert({
                where: {
                    parentNodeTypeId_childNodeTypeId: {
                        parentNodeTypeId: parentId,
                        childNodeTypeId: childId
                    }
                },
                update: {},
                create: {
                    parentNodeTypeId: parentId,
                    childNodeTypeId: childId
                }
            });
        }
    }

    // Resolve or Create Sprints
    const existingSprints = await prisma.sprint.findMany({
        where: { projectId, userId: session.user.id }
    });
    const sprintMap = new Map<string, string>();
    existingSprints.forEach((s: any) => sprintMap.set(s.name, s.id));

    for (const s of sprints) {
        if (!sprintMap.has(s.name)) {
            const created = await prisma.sprint.create({
                data: {
                    name: s.name,
                    status: s.status || "PLANNED",
                    startDate: s.startDate ? new Date(s.startDate) : null,
                    endDate: s.endDate ? new Date(s.endDate) : null,
                    projectId,
                    userId: session.user.id
                }
            });
            sprintMap.set(s.name, created.id);
        }
    }

    // Create Nodes
    const nodeRefMap = new Map<string, string>(); // tempId -> realId
    
    for (const n of nodes) {
        const typeId = typeMap.get(n.type);
        if (!typeId) continue;

        const sprintId = n.sprint ? sprintMap.get(n.sprint) : undefined;

        const createdNode = await prisma.node.create({
            data: {
                title: n.title,
                description: n.description || "",
                status: n.status || "TODO",
                content: n.content || {},
                nodeTypeId: typeId,
                projectId,
                userId: session.user.id,
                sprintId: sprintId,
                startDate: n.startDate ? new Date(n.startDate) : null,
                endDate: n.endDate ? new Date(n.endDate) : null,
            }
        });
        
        if (n.id) nodeRefMap.set(n.id, createdNode.id);
        nodeRefMap.set(n.title, createdNode.id);
    }

    // Create Links (Parent-Child)
    for (const n of nodes) {
        if (n.children && n.children.length > 0) {
            const parentId = nodeRefMap.get(n.id) || nodeRefMap.get(n.title);
            if (!parentId) continue;

            for (const childRef of n.children) {
                const childId = nodeRefMap.get(childRef);
                if (childId) {
                    await prisma.nodeLink.upsert({
                        where: { parentNodeId_childNodeId: { parentNodeId: parentId, childNodeId: childId } },
                        update: {},
                        create: { parentNodeId: parentId, childNodeId: childId }
                    });
                }
            }
        }
    }

    revalidatePath(`/project/${projectId}/backlog`);
    revalidatePath(`/project/${projectId}/board`);
    
    return { success: true, count: nodes.length };
}
