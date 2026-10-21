import { timingSafeEqual } from "node:crypto";
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import prisma from "./lib/db.js";

/**
 * SECURITY MODEL
 * - Only the QuickPlanner web app may talk to this server: every request must carry
 *   `Authorization: Bearer $MCP_AUTH_TOKEN` (the server refuses to start without one).
 * - The web app injects the signed-in user's id as `userId` and decides whether a
 *   mutation was confirmed by that user. The model never controls either value.
 * - Every query below is scoped to the projects `userId` owns or is a member of (viewers are read-only,
 *   only the owner may rename/archive/delete a project), so a tool call can only touch what that user can.
 */

const AUTH_TOKEN = process.env.MCP_AUTH_TOKEN;
if (!AUTH_TOKEN) {
  console.error("MCP_AUTH_TOKEN is not set; refusing to start an unauthenticated MCP server.");
  process.exit(1);
}

const NODE_STATUSES = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] as const;
const SPRINT_STATUSES = ["PLANNED", "ACTIVE", "COMPLETED"] as const;
const MAX_TITLE = 200;
const LIST_LIMIT = 200;

type ToolResult = { content: { type: "text"; text: string }[]; isError?: boolean };
const ok = (text: string): ToolResult => ({ content: [{ type: "text", text }] });
const json = (value: unknown): ToolResult => ok(JSON.stringify(value, null, 2));
const fail = (prefix: string, e: unknown): ToolResult => ({
  content: [{ type: "text", text: `${prefix}: ${e instanceof Error ? e.message : String(e)}` }],
  isError: true,
});

// ---------------------------------------------------------------------------
// Validation + ownership helpers
// ---------------------------------------------------------------------------

function title(value: string | undefined, label = "title"): string {
  const trimmed = value?.trim();
  if (!trimmed) throw new Error(`${label} is required`);
  if (trimmed.length > MAX_TITLE) throw new Error(`${label} must be at most ${MAX_TITLE} characters`);
  return trimmed;
}

function date(value: string | undefined, label: string): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === "") return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid ${label}`);
  return d;
}

function oneOf<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if (!(allowed as readonly string[]).includes(value)) throw new Error(`Invalid ${label}: ${value}. Allowed: ${allowed.join(", ")}`);
  return value as T;
}

function need<T>(value: T | undefined | null, name: string, action: string): T {
  if (value === undefined || value === null || value === "") throw new Error(`${name} is required for ${action} action`);
  return value;
}

/** Prisma filter: projects `userId` owns or is a member of. */
const P = (userId: string) => ({ OR: [{ userId }, { members: { some: { userId } } }] });

/**
 * Throws unless `userId` may access the project. Writes need owner/editor and a non-archived project;
 * `ownerOnly` (rename, archive, delete) needs the owner.
 */
async function projectFor(userId: string, projectId: string, write: boolean, ownerOnly = false) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, ...P(userId) },
    include: { members: { where: { userId }, select: { role: true } } },
  });
  if (!project) throw new Error("Project not found");
  const isOwner = project.userId === userId;
  if ((write || ownerOnly) && !isOwner && (ownerOnly || project.members[0]?.role !== "EDITOR")) {
    throw new Error(ownerOnly ? "Only the project owner can do this" : "You have view-only access to this project");
  }
  if (write && project.isArchived) throw new Error("Cannot modify a decommissioned project");
  return project;
}

async function history(entry: {
  userId: string; projectId: string; nodeId?: string; action: string; entityType: string;
  entityName?: string; oldValue?: string; newValue?: string;
}) {
  await prisma.historyEvent.create({ data: entry });
}

function pending(tool: string, action: string, entity: string, params: Record<string, unknown>): ToolResult {
  return json({
    status: "pending_confirmation",
    message: `PROPOSED CHANGE: '${action}' on ${entity}. Waiting for the user to confirm.`,
    proposedAction: { tool, action, params },
  });
}

/** `completedAt` is the moment an item last became DONE (drives the app's burndown and velocity); mirrors the web app. */
function completedAtFor(oldStatus: string | null, newStatus: string): Date | null | undefined {
  const wasDone = oldStatus === "DONE";
  const isDone = newStatus === "DONE";
  if (isDone && !wasDone) return new Date();
  if (!isDone && wasDone) return null;
  return undefined;
}

/** Parents of `nodeId` get their status re-derived from their children (mirrors the web app). */
async function reconcileParents(userId: string, projectId: string, nodeId: string) {
  const links = await prisma.nodeLink.findMany({ where: { childNodeId: nodeId }, select: { parentNodeId: true } });
  await reconcileFrom(userId, projectId, links.map((l) => l.parentNodeId), nodeId);
}

async function reconcileFrom(userId: string, projectId: string, parentIds: string[], startId?: string) {
  const seen = new Set<string>(startId ? [startId] : []);
  let frontier = [...new Set(parentIds)];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const parentId of frontier) {
      if (seen.has(parentId)) continue;
      seen.add(parentId);
      const parent = await prisma.node.findFirst({ where: { id: parentId, project: P(userId) }, select: { id: true, title: true, status: true } });
      if (!parent) continue;
      const kids = await prisma.nodeLink.findMany({ where: { parentNodeId: parentId, childNode: { isArchived: false } }, select: { childNode: { select: { status: true } } } });
      if (kids.length === 0) continue;
      const statuses = kids.map((k) => k.childNode.status);
      const allDone = statuses.every((s) => s === "DONE");
      let target: string | null = null;
      if (allDone) target = parent.status === "DONE" ? null : "DONE";
      else if (parent.status === "DONE") target = "IN_PROGRESS";
      else if (parent.status === "TODO" && statuses.some((s) => s !== "TODO")) target = "IN_PROGRESS";
      if (!target) continue;
      await prisma.node.update({ where: { id: parent.id }, data: { status: target, completedAt: completedAtFor(parent.status, target) } });
      await history({ userId, projectId, nodeId: parent.id, action: "STATUS_CHANGE", entityType: "NODE", entityName: parent.title, oldValue: parent.status, newValue: `${target} (Auto)` });
      const up = await prisma.nodeLink.findMany({ where: { childNodeId: parent.id }, select: { parentNodeId: true } });
      next.push(...up.map((l) => l.parentNodeId));
    }
    frontier = next;
  }
}

/** Walks `edges` from `start`; true if `target` is reachable (cycle detection for links). */
async function reachable(start: string, target: string, edges: (ids: string[]) => Promise<string[]>) {
  if (start === target) return true;
  const seen = new Set<string>([start]);
  let frontier = [start];
  while (frontier.length > 0) {
    const next: string[] = [];
    for (const id of await edges(frontier)) {
      if (id === target) return true;
      if (!seen.has(id)) { seen.add(id); next.push(id); }
    }
    frontier = next;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

const baseFields = {
  action: z.enum(["create", "read", "update", "delete", "list"]),
  userId: z.string().describe("Injected by the platform."),
  confirmed: z.boolean().optional().default(false).describe("Set by the platform after the user approves."),
};

function createServer() {
  const server = new McpServer({ name: "QuickPlannerMCP", version: "2.0.0" });

  server.tool(
    "web_search",
    { query: z.string().describe("The search query to look up on the web.") },
    async ({ query }) => {
      try {
        // Wikipedia API as a free, built-in search alternative.
        const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`, { signal: AbortSignal.timeout(10_000) });
        if (!response.ok) throw new Error(`Search failed with status ${response.status}`);
        const data = (await response.json()) as { query?: { search?: { title: string; snippet: string }[] } };
        const hits = data.query?.search ?? [];
        if (hits.length === 0) return ok(`No results found for "${query}".`);
        const results = hits.slice(0, 3).map((item) => `Title: ${item.title}\nSnippet: ${item.snippet.replace(/<[^>]*>?/gm, "")}\n`).join("\n---\n");
        return ok(`Search results for "${query}":\n\n${results}`);
      } catch (e) {
        return fail("Error performing web search", e);
      }
    }
  );

  server.tool(
    "manage_projects",
    {
      ...baseFields,
      projectId: z.string().optional(),
      name: z.string().optional(),
      isArchived: z.boolean().optional(),
    },
    async ({ action, projectId, name, isArchived, userId, confirmed }) => {
      try {
        if (action === "list") {
          return json(await prisma.project.findMany({ where: P(userId), orderBy: { createdAt: "desc" }, take: LIST_LIMIT }));
        }
        if (action === "read") {
          return json(await projectFor(userId, need(projectId, "projectId", action), false));
        }
        if (!confirmed) return pending("manage_projects", action, "Project", { projectId, name, isArchived });

        if (action === "create") {
          const project = await prisma.project.create({ data: { name: title(name, "name"), userId } });
          await history({ userId, projectId: project.id, action: "CREATE", entityType: "PROJECT", entityName: project.name });
          return ok(`Project created successfully: ${project.name} (ID: ${project.id})`);
        }
        const id = need(projectId, "projectId", action);
        if (action === "update") {
          const existing = await projectFor(userId, id, false, true);
          const data: { name?: string; isArchived?: boolean } = {};
          if (name !== undefined) data.name = title(name, "name");
          if (isArchived !== undefined) data.isArchived = isArchived;
          // An archived project may only be un-archived.
          if (existing.isArchived && data.isArchived !== false) throw new Error("Cannot modify a decommissioned project");
          const project = await prisma.project.update({ where: { id }, data });
          return ok(`Project updated successfully: ${project.name}`);
        }
        if (action === "delete") {
          await projectFor(userId, id, false, true);
          await prisma.project.delete({ where: { id } });
          return ok(`Project deleted successfully (ID: ${id})`);
        }
        throw new Error("Invalid action");
      } catch (e) {
        return fail("Error managing project", e);
      }
    }
  );

  server.tool(
    "manage_nodes",
    {
      ...baseFields,
      nodeId: z.string().optional(),
      projectId: z.string().optional(),
      nodeTypeId: z.string().optional(),
      title: z.string().optional(),
      description: z.string().optional(),
      status: z.string().optional().describe(`One of: ${NODE_STATUSES.join(", ")}`),
      sprintId: z.string().optional().describe('Sprint id, or "backlog" for none.'),
      isArchived: z.boolean().optional(),
      startDate: z.string().optional().describe("ISO date, or empty string to clear."),
      endDate: z.string().optional().describe("ISO date, or empty string to clear."),
    },
    async ({ action, nodeId, projectId, nodeTypeId, title: nodeTitle, description, status, sprintId, isArchived, startDate, endDate, userId, confirmed }) => {
      try {
        if (action === "list") {
          const where: Record<string, unknown> = { project: P(userId) };
          if (projectId) where.projectId = projectId;
          if (nodeTypeId) where.nodeTypeId = nodeTypeId;
          if (sprintId) where.sprintId = sprintId === "backlog" ? null : sprintId;
          return json(await prisma.node.findMany({ where, include: { type: true, sprint: true }, orderBy: { createdAt: "desc" }, take: LIST_LIMIT }));
        }
        if (action === "read") {
          const node = await prisma.node.findFirst({
            where: { id: need(nodeId, "nodeId", action), project: P(userId) },
            include: { type: true, sprint: true, parentLinks: true, childLinks: true },
          });
          if (!node) throw new Error("Node not found");
          return json(node);
        }
        if (!confirmed) return pending("manage_nodes", action, "Node", { nodeId, projectId, nodeTypeId, title: nodeTitle, description, status, sprintId, isArchived, startDate, endDate });

        if (action === "create") {
          const pid = need(projectId, "projectId", action);
          const typeId = need(nodeTypeId, "nodeTypeId", action);
          await projectFor(userId, pid, true);
          if (!(await prisma.nodeType.findFirst({ where: { id: typeId, projectId: pid }, select: { id: true } }))) throw new Error("Node type not found in this project");
          const sprint = sprintId && sprintId !== "backlog" ? sprintId : null;
          if (sprint && !(await prisma.sprint.findFirst({ where: { id: sprint, projectId: pid }, select: { id: true } }))) throw new Error("Sprint not found in this project");
          const start = date(startDate, "startDate") ?? null;
          const end = date(endDate, "endDate") ?? null;
          if (start && end && end < start) throw new Error("endDate cannot be before startDate");

          const initialStatus = status ? oneOf(status, NODE_STATUSES, "status") : "TODO";
          const last = await prisma.node.aggregate({ where: { projectId: pid }, _max: { position: true } });
          const node = await prisma.node.create({
            data: {
              title: title(nodeTitle), description, projectId: pid, nodeTypeId: typeId, userId, sprintId: sprint,
              status: initialStatus, completedAt: initialStatus === "DONE" ? new Date() : null,
              position: (last._max.position ?? 0) + 1024,
              startDate: start, endDate: end,
            },
          });
          await history({ userId, projectId: pid, nodeId: node.id, action: "CREATE", entityType: "NODE", entityName: node.title });
          return ok(`Node created successfully: ${node.title} (ID: ${node.id})`);
        }

        const id = need(nodeId, "nodeId", action);
        const existing = await prisma.node.findFirst({ where: { id, project: P(userId) } });
        if (!existing) throw new Error("Node not found");
        await projectFor(userId, existing.projectId, true);

        if (action === "update") {
          const data: Record<string, unknown> = {};
          if (nodeTitle !== undefined) data.title = title(nodeTitle);
          if (description !== undefined) data.description = description;
          if (status !== undefined) {
            data.status = oneOf(status, NODE_STATUSES, "status");
            const completedAt = completedAtFor(existing.status, data.status as string);
            if (completedAt !== undefined) data.completedAt = completedAt;
          }
          if (isArchived !== undefined) data.isArchived = isArchived;
          if (sprintId !== undefined) {
            if (sprintId === "backlog") data.sprintId = null;
            else {
              if (!(await prisma.sprint.findFirst({ where: { id: sprintId, projectId: existing.projectId }, select: { id: true } }))) throw new Error("Sprint not found in this project");
              data.sprintId = sprintId;
            }
          }
          const start = date(startDate, "startDate");
          const end = date(endDate, "endDate");
          if (start !== undefined) data.startDate = start;
          if (end !== undefined) data.endDate = end;
          const effStart = start !== undefined ? start : existing.startDate;
          const effEnd = end !== undefined ? end : existing.endDate;
          if (effStart && effEnd && effEnd < effStart) throw new Error("endDate cannot be before startDate");

          const node = await prisma.node.update({ where: { id }, data });
          if (data.status && data.status !== existing.status) {
            await history({ userId, projectId: node.projectId, nodeId: id, action: "STATUS_CHANGE", entityType: "NODE", entityName: node.title, oldValue: existing.status, newValue: node.status });
            await reconcileParents(userId, node.projectId, id);
          } else if (data.title && data.title !== existing.title) {
            await history({ userId, projectId: node.projectId, nodeId: id, action: "UPDATE", entityType: "NODE", entityName: node.title, oldValue: existing.title, newValue: node.title });
          }
          return ok(`Node updated successfully: ${node.title}`);
        }
        if (action === "delete") {
          const parents = await prisma.nodeLink.findMany({ where: { childNodeId: id }, select: { parentNodeId: true } });
          await prisma.node.delete({ where: { id } });
          await history({ userId, projectId: existing.projectId, action: "DELETE", entityType: "NODE", entityName: existing.title });
          await reconcileFrom(userId, existing.projectId, parents.map((p) => p.parentNodeId));
          return ok(`Node deleted successfully (ID: ${id})`);
        }
        throw new Error("Invalid action");
      } catch (e) {
        return fail("Error managing node", e);
      }
    }
  );

  server.tool(
    "manage_sprints",
    {
      ...baseFields,
      sprintId: z.string().optional(),
      projectId: z.string().optional(),
      name: z.string().optional(),
      status: z.string().optional().describe(`One of: ${SPRINT_STATUSES.join(", ")}`),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    },
    async ({ action, sprintId, projectId, name, status, startDate, endDate, userId, confirmed }) => {
      try {
        if (action === "list") {
          const pid = need(projectId, "projectId", action);
          await projectFor(userId, pid, false);
          return json(await prisma.sprint.findMany({ where: { projectId: pid }, orderBy: { createdAt: "desc" }, take: LIST_LIMIT }));
        }
        if (action === "read") {
          const sprint = await prisma.sprint.findFirst({ where: { id: need(sprintId, "sprintId", action), project: P(userId) }, include: { nodes: true } });
          if (!sprint) throw new Error("Sprint not found");
          return json(sprint);
        }
        if (!confirmed) return pending("manage_sprints", action, "Sprint", { sprintId, projectId, name, status, startDate, endDate });

        if (action === "create") {
          const pid = need(projectId, "projectId", action);
          await projectFor(userId, pid, true);
          const start = date(startDate, "startDate") ?? null;
          const end = date(endDate, "endDate") ?? null;
          if (start && end && end < start) throw new Error("endDate cannot be before startDate");
          const sprintStatus = status ? oneOf(status, SPRINT_STATUSES, "status") : "PLANNED";
          const sprint = await prisma.$transaction(async (tx) => {
            if (sprintStatus === "ACTIVE") await tx.sprint.updateMany({ where: { projectId: pid, status: "ACTIVE" }, data: { status: "PLANNED" } });
            return tx.sprint.create({ data: { name: title(name, "name"), status: sprintStatus, projectId: pid, userId, startDate: start, endDate: end } });
          });
          await history({ userId, projectId: pid, action: "CREATE", entityType: "SPRINT", entityName: sprint.name });
          return ok(`Sprint created successfully: ${sprint.name} (ID: ${sprint.id})`);
        }

        const id = need(sprintId, "sprintId", action);
        const existing = await prisma.sprint.findFirst({ where: { id, project: P(userId) } });
        if (!existing) throw new Error("Sprint not found");
        await projectFor(userId, existing.projectId, true);

        if (action === "update") {
          const data: Record<string, unknown> = {};
          if (name !== undefined) data.name = title(name, "name");
          if (status !== undefined) data.status = oneOf(status, SPRINT_STATUSES, "status");
          const start = date(startDate, "startDate");
          const end = date(endDate, "endDate");
          if (start !== undefined) data.startDate = start;
          if (end !== undefined) data.endDate = end;
          const effStart = start !== undefined ? start : existing.startDate;
          const effEnd = end !== undefined ? end : existing.endDate;
          if (effStart && effEnd && effEnd < effStart) throw new Error("endDate cannot be before startDate");

          const sprint = await prisma.$transaction(async (tx) => {
            if (data.status === "ACTIVE") await tx.sprint.updateMany({ where: { projectId: existing.projectId, status: "ACTIVE", id: { not: id } }, data: { status: "PLANNED" } });
            return tx.sprint.update({ where: { id }, data });
          });
          if (data.status && data.status !== existing.status) {
            await history({ userId, projectId: existing.projectId, action: "STATUS_CHANGE", entityType: "SPRINT", entityName: sprint.name, oldValue: existing.status, newValue: sprint.status });
          }
          return ok(`Sprint updated successfully: ${sprint.name}`);
        }
        if (action === "delete") {
          await prisma.sprint.delete({ where: { id } });
          await history({ userId, projectId: existing.projectId, action: "DELETE", entityType: "SPRINT", entityName: existing.name });
          return ok(`Sprint deleted successfully (ID: ${id})`);
        }
        throw new Error("Invalid action");
      } catch (e) {
        return fail("Error managing sprint", e);
      }
    }
  );

  server.tool(
    "manage_node_types",
    {
      ...baseFields,
      nodeTypeId: z.string().optional(),
      projectId: z.string().optional(),
      name: z.string().optional(),
      color: z.string().optional(),
      icon: z.string().optional(),
      isSprintEligible: z.boolean().optional(),
    },
    async ({ action, nodeTypeId, projectId, name, color, icon, isSprintEligible, userId, confirmed }) => {
      try {
        if (action === "list") {
          const pid = need(projectId, "projectId", action);
          await projectFor(userId, pid, false);
          return json(await prisma.nodeType.findMany({ where: { projectId: pid }, orderBy: { createdAt: "desc" }, take: LIST_LIMIT }));
        }
        if (action === "read") {
          const nodeType = await prisma.nodeType.findFirst({ where: { id: need(nodeTypeId, "nodeTypeId", action), project: P(userId) } });
          if (!nodeType) throw new Error("NodeType not found");
          return json(nodeType);
        }
        if (!confirmed) return pending("manage_node_types", action, "NodeType", { nodeTypeId, projectId, name, color, icon, isSprintEligible });

        if (action === "create") {
          const pid = need(projectId, "projectId", action);
          await projectFor(userId, pid, true);
          const nodeType = await prisma.nodeType.create({
            data: {
              name: title(name, "name"), projectId: pid, userId,
              color: color?.trim().slice(0, 64) || "#3b82f6",
              icon: icon?.trim().slice(0, 64) || "Target",
              isSprintEligible: isSprintEligible ?? true,
            },
          });
          await history({ userId, projectId: pid, action: "CREATE", entityType: "NODETYPE", entityName: nodeType.name });
          return ok(`NodeType created successfully: ${nodeType.name} (ID: ${nodeType.id})`);
        }

        const id = need(nodeTypeId, "nodeTypeId", action);
        const existing = await prisma.nodeType.findFirst({ where: { id, project: P(userId) } });
        if (!existing) throw new Error("NodeType not found");
        await projectFor(userId, existing.projectId, true);

        if (action === "update") {
          const data: Record<string, unknown> = {};
          if (name !== undefined) data.name = title(name, "name");
          if (color !== undefined) data.color = color.trim().slice(0, 64);
          if (icon !== undefined) data.icon = icon.trim().slice(0, 64);
          if (isSprintEligible !== undefined) data.isSprintEligible = isSprintEligible;
          const nodeType = await prisma.nodeType.update({ where: { id }, data });
          return ok(`NodeType updated successfully: ${nodeType.name}`);
        }
        if (action === "delete") {
          const inUse = await prisma.node.count({ where: { nodeTypeId: id } });
          if (inUse > 0) throw new Error(`Cannot delete "${existing.name}": ${inUse} node(s) still use this type`);
          await prisma.nodeType.delete({ where: { id } });
          await history({ userId, projectId: existing.projectId, action: "DELETE", entityType: "NODETYPE", entityName: existing.name });
          return ok(`NodeType deleted successfully (ID: ${id})`);
        }
        throw new Error("Invalid action");
      } catch (e) {
        return fail("Error managing node type", e);
      }
    }
  );

  server.tool(
    "manage_node_links",
    {
      action: z.enum(["create", "delete", "list"]),
      linkType: z.enum(["parent-child", "dependency"]),
      parentNodeId: z.string().optional(),
      childNodeId: z.string().optional(),
      blockedNodeId: z.string().optional(),
      blockingNodeId: z.string().optional(),
      projectId: z.string().optional().describe("Filter for list."),
      userId: z.string().describe("Injected by the platform."),
      confirmed: z.boolean().optional().default(false).describe("Set by the platform after the user approves."),
    },
    async ({ action, linkType, parentNodeId, childNodeId, blockedNodeId, blockingNodeId, projectId, userId, confirmed }) => {
      try {
        if (action === "list") {
          const nodeScope = { project: P(userId), ...(projectId ? { projectId } : {}) };
          if (linkType === "parent-child") {
            return json(await prisma.nodeLink.findMany({ where: { parentNode: nodeScope }, take: LIST_LIMIT }));
          }
          return json(await prisma.nodeDependency.findMany({ where: { blockedNode: nodeScope }, take: LIST_LIMIT }));
        }
        if (!confirmed) return pending("manage_node_links", action, `NodeLink (${linkType})`, { linkType, parentNodeId, childNodeId, blockedNodeId, blockingNodeId });

        const isTree = linkType === "parent-child";
        const a = isTree ? need(parentNodeId, "parentNodeId", action) : need(blockedNodeId, "blockedNodeId", action);
        const b = isTree ? need(childNodeId, "childNodeId", action) : need(blockingNodeId, "blockingNodeId", action);
        if (a === b) throw new Error("A node cannot be linked to itself");

        const nodes = await prisma.node.findMany({ where: { id: { in: [a, b] }, project: P(userId) }, select: { id: true, projectId: true, nodeTypeId: true } });
        if (nodes.length !== 2) throw new Error("Node not found");
        if (nodes[0].projectId !== nodes[1].projectId) throw new Error("Nodes must belong to the same project");
        await projectFor(userId, nodes[0].projectId, true);

        if (action === "create") {
          if (isTree) {
            const parent = nodes.find((n) => n.id === a)!;
            const child = nodes.find((n) => n.id === b)!;
            if (!(await prisma.allowedRelation.findFirst({ where: { parentNodeTypeId: parent.nodeTypeId, childNodeTypeId: child.nodeTypeId } }))) {
              throw new Error("These node types are not allowed to be parent and child");
            }
            // Would the child already be an ancestor of the parent?
            const cycle = await reachable(a, b, async (ids) => (await prisma.nodeLink.findMany({ where: { childNodeId: { in: ids } }, select: { parentNodeId: true } })).map((l) => l.parentNodeId));
            if (cycle) throw new Error("This link would create a loop in the hierarchy");
            const link = await prisma.nodeLink.upsert({
              where: { parentNodeId_childNodeId: { parentNodeId: a, childNodeId: b } },
              create: { parentNodeId: a, childNodeId: b }, update: {},
            });
            await reconcileParents(userId, parent.projectId, b);
            return ok(`Parent-Child link created successfully (ID: ${link.id})`);
          }
          const cycle = await reachable(a, b, async (ids) => (await prisma.nodeDependency.findMany({ where: { blockingNodeId: { in: ids } }, select: { blockedNodeId: true } })).map((d) => d.blockedNodeId));
          if (cycle) throw new Error("This dependency would create a circular chain");
          const dep = await prisma.nodeDependency.upsert({
            where: { blockedNodeId_blockingNodeId: { blockedNodeId: a, blockingNodeId: b } },
            create: { blockedNodeId: a, blockingNodeId: b }, update: {},
          });
          return ok(`Dependency link created successfully (ID: ${dep.id})`);
        }

        if (action === "delete") {
          if (isTree) {
            await prisma.nodeLink.deleteMany({ where: { parentNodeId: a, childNodeId: b } });
            return ok("Parent-Child link deleted successfully");
          }
          await prisma.nodeDependency.deleteMany({ where: { blockedNodeId: a, blockingNodeId: b } });
          return ok("Dependency link deleted successfully");
        }
        throw new Error("Invalid action");
      } catch (e) {
        return fail("Error managing node link", e);
      }
    }
  );

  return server;
}

// ---------------------------------------------------------------------------
// HTTP / SSE transport: one McpServer + transport per connected client
// ---------------------------------------------------------------------------

function isAuthorized(header: string | undefined): boolean {
  const expected = Buffer.from(`Bearer ${AUTH_TOKEN}`);
  const given = Buffer.from(header ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

const app = express();
app.disable("x-powered-by");

app.use((req, res, next) => {
  if (req.path === "/health") return next();
  if (!isAuthorized(req.headers.authorization)) {
    res.status(401).send("Unauthorized");
    return;
  }
  next();
});

app.get("/health", (_req, res) => {
  res.send("ok");
});

const transports = new Map<string, SSEServerTransport>();

app.get("/sse", async (_req, res) => {
  const transport = new SSEServerTransport("/message", res);
  transports.set(transport.sessionId, transport);
  res.on("close", () => {
    transports.delete(transport.sessionId);
  });
  await createServer().connect(transport);
});

app.post("/message", async (req, res) => {
  const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : "";
  const transport = transports.get(sessionId);
  if (!transport) {
    res.status(400).send("No active SSE session for this sessionId");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`QuickPlanner MCP Server running on port ${PORT}`);
});
