import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import prisma from "./lib/db.js";

const server = new McpServer({
  name: "QuickPlannerMCP",
  version: "1.0.0",
});

server.tool(
  "update_project_name",
  {
    projectId: z.string(),
    name: z.string(),
  },
  async ({ projectId, name }) => {
    try {
      const project = await prisma.project.update({
        where: { id: projectId },
        data: { name },
      });
      return {
        content: [{ type: "text", text: `Project updated successfully: ${project.name}` }],
      };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error updating project: ${e.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "update_node_type",
  {
    nodeTypeId: z.string(),
    color: z.string().optional(),
    icon: z.string().optional(),
    isSprintEligible: z.boolean().optional(),
  },
  async ({ nodeTypeId, color, icon, isSprintEligible }) => {
    try {
      const data: any = {};
      if (color !== undefined) data.color = color;
      if (icon !== undefined) data.icon = icon;
      if (isSprintEligible !== undefined) data.isSprintEligible = isSprintEligible;

      const nodeType = await prisma.nodeType.update({
        where: { id: nodeTypeId },
        data,
      });
      return {
        content: [{ type: "text", text: `NodeType updated successfully: ${nodeType.name}` }],
      };
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error updating node type: ${e.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "web_search",
  {
    query: z.string().describe("The search query to look up on the web."),
  },
  async ({ query }) => {
    try {
      // Using Wikipedia API as a free, built-in search alternative
      const response = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`);
      const data = await response.json();
      
      if (data.query && data.query.search && data.query.search.length > 0) {
        const results = data.query.search.slice(0, 3).map((item: any) => {
          // Remove HTML tags from snippet
          const snippet = item.snippet.replace(/<[^>]*>?/gm, '');
          return `Title: ${item.title}\nSnippet: ${snippet}\n`;
        }).join("\n---\n");
        
        return {
          content: [{ type: "text", text: `Search results for "${query}":\n\n${results}` }],
        };
      } else {
        return {
          content: [{ type: "text", text: `No results found for "${query}".` }],
        };
      }
    } catch (e: any) {
      return {
        content: [{ type: "text", text: `Error performing web search: ${e.message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "manage_projects",
  {
    action: z.enum(["create", "read", "update", "delete", "list"]),
    projectId: z.string().optional(),
    name: z.string().optional(),
    isArchived: z.boolean().optional(),
    userId: z.string().optional(),
    confirmed: z.boolean().optional().default(false),
  },
  async ({ action, projectId, name, isArchived, userId, confirmed }) => {
    try {
      if (action === "list") {
        const projects = await prisma.project.findMany({
          where: userId ? { userId } : undefined,
          orderBy: { createdAt: "desc" },
        });
        return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
      }

      if (action === "read") {
        if (!projectId) throw new Error("projectId is required for read action");
        const project = await prisma.project.findUnique({ where: { id: projectId } });
        if (!project) throw new Error("Project not found");
        return { content: [{ type: "text", text: JSON.stringify(project, null, 2) }] };
      }

      if (!confirmed) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "pending_confirmation",
              message: `PROPOSED CHANGE: You are about to perform a '${action}' action on Project. Please confirm to apply these changes.`,
              proposedAction: { tool: "manage_projects", action, params: { projectId, name, isArchived } }
            }, null, 2)
          }]
        };
      }

      if (action === "create") {
        if (!name) throw new Error("name is required for create action");
        if (!userId) throw new Error("userId is required for create action");
        const project = await prisma.project.create({
          data: { name, userId }
        });
        return { content: [{ type: "text", text: `Project created successfully: ${project.name} (ID: ${project.id})` }] };
      }

      if (action === "update") {
        if (!projectId) throw new Error("projectId is required for update action");
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (isArchived !== undefined) data.isArchived = isArchived;

        const project = await prisma.project.update({
          where: { id: projectId },
          data,
        });
        return { content: [{ type: "text", text: `Project updated successfully: ${project.name}` }] };
      }

      if (action === "delete") {
        if (!projectId) throw new Error("projectId is required for delete action");
        await prisma.project.delete({ where: { id: projectId } });
        return { content: [{ type: "text", text: `Project deleted successfully (ID: ${projectId})` }] };
      }

      throw new Error("Invalid action");
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error managing project: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "manage_nodes",
  {
    action: z.enum(["create", "read", "update", "delete", "list"]),
    nodeId: z.string().optional(),
    projectId: z.string().optional(),
    nodeTypeId: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    sprintId: z.string().optional(),
    isArchived: z.boolean().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    userId: z.string().optional(),
    confirmed: z.boolean().optional().default(false),
  },
  async ({ action, nodeId, projectId, nodeTypeId, title, description, status, sprintId, isArchived, startDate, endDate, userId, confirmed }) => {
    try {
      if (action === "list") {
        const where: any = {};
        if (projectId) where.projectId = projectId;
        if (nodeTypeId) where.nodeTypeId = nodeTypeId;
        if (sprintId) where.sprintId = sprintId === "backlog" ? null : sprintId;
        if (userId) where.userId = userId;

        const nodes = await prisma.node.findMany({
          where,
          include: { type: true, sprint: true },
          orderBy: { createdAt: "desc" },
        });
        return { content: [{ type: "text", text: JSON.stringify(nodes, null, 2) }] };
      }

      if (action === "read") {
        if (!nodeId) throw new Error("nodeId is required for read action");
        const node = await prisma.node.findUnique({
          where: { id: nodeId },
          include: { type: true, sprint: true, parentLinks: true, childLinks: true }
        });
        if (!node) throw new Error("Node not found");
        return { content: [{ type: "text", text: JSON.stringify(node, null, 2) }] };
      }

      if (!confirmed) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "pending_confirmation",
              message: `PROPOSED CHANGE: You are about to perform a '${action}' action on Node. Please confirm to apply these changes.`,
              proposedAction: { tool: "manage_nodes", action, params: { nodeId, projectId, nodeTypeId, title, description, status, sprintId, isArchived, startDate, endDate } }
            }, null, 2)
          }]
        };
      }

      if (action === "create") {
        if (!projectId) throw new Error("projectId is required for create action");
        if (!nodeTypeId) throw new Error("nodeTypeId is required for create action");
        if (!title) throw new Error("title is required for create action");
        if (!userId) throw new Error("userId is required for create action");

        const node = await prisma.node.create({
          data: {
            title,
            description,
            status: status || "TODO",
            projectId,
            nodeTypeId,
            userId,
            sprintId: sprintId || null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
          }
        });
        return { content: [{ type: "text", text: `Node created successfully: ${node.title} (ID: ${node.id})` }] };
      }

      if (action === "update") {
        if (!nodeId) throw new Error("nodeId is required for update action");
        const data: any = {};
        if (title !== undefined) data.title = title;
        if (description !== undefined) data.description = description;
        if (status !== undefined) data.status = status;
        if (isArchived !== undefined) data.isArchived = isArchived;
        if (sprintId !== undefined) data.sprintId = sprintId === "backlog" ? null : sprintId;
        if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

        const node = await prisma.node.update({
          where: { id: nodeId },
          data,
        });
        return { content: [{ type: "text", text: `Node updated successfully: ${node.title}` }] };
      }

      if (action === "delete") {
        if (!nodeId) throw new Error("nodeId is required for delete action");
        await prisma.node.delete({ where: { id: nodeId } });
        return { content: [{ type: "text", text: `Node deleted successfully (ID: ${nodeId})` }] };
      }

      throw new Error("Invalid action");
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error managing node: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "manage_sprints",
  {
    action: z.enum(["create", "read", "update", "delete", "list"]),
    sprintId: z.string().optional(),
    projectId: z.string().optional(),
    name: z.string().optional(),
    status: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    userId: z.string().optional(),
    confirmed: z.boolean().optional().default(false),
  },
  async ({ action, sprintId, projectId, name, status, startDate, endDate, userId, confirmed }) => {
    try {
      if (action === "list") {
        if (!projectId) throw new Error("projectId is required for list action");
        const sprints = await prisma.sprint.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
        });
        return { content: [{ type: "text", text: JSON.stringify(sprints, null, 2) }] };
      }

      if (action === "read") {
        if (!sprintId) throw new Error("sprintId is required for read action");
        const sprint = await prisma.sprint.findUnique({
          where: { id: sprintId },
          include: { nodes: true }
        });
        if (!sprint) throw new Error("Sprint not found");
        return { content: [{ type: "text", text: JSON.stringify(sprint, null, 2) }] };
      }

      if (!confirmed) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "pending_confirmation",
              message: `PROPOSED CHANGE: You are about to perform a '${action}' action on Sprint. Please confirm to apply these changes.`,
              proposedAction: { tool: "manage_sprints", action, params: { sprintId, projectId, name, status, startDate, endDate } }
            }, null, 2)
          }]
        };
      }

      if (action === "create") {
        if (!projectId) throw new Error("projectId is required for create action");
        if (!name) throw new Error("name is required for create action");
        if (!userId) throw new Error("userId is required for create action");

        const sprint = await prisma.sprint.create({
          data: {
            name,
            status: status || "PLANNED",
            projectId,
            userId,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
          }
        });
        return { content: [{ type: "text", text: `Sprint created successfully: ${sprint.name} (ID: ${sprint.id})` }] };
      }

      if (action === "update") {
        if (!sprintId) throw new Error("sprintId is required for update action");
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (status !== undefined) data.status = status;
        if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
        if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;

        const sprint = await prisma.sprint.update({
          where: { id: sprintId },
          data,
        });
        return { content: [{ type: "text", text: `Sprint updated successfully: ${sprint.name}` }] };
      }

      if (action === "delete") {
        if (!sprintId) throw new Error("sprintId is required for delete action");
        await prisma.sprint.delete({ where: { id: sprintId } });
        return { content: [{ type: "text", text: `Sprint deleted successfully (ID: ${sprintId})` }] };
      }

      throw new Error("Invalid action");
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error managing sprint: ${e.message}` }], isError: true };
    }
  }
);

server.tool(
  "manage_node_types",
  {
    action: z.enum(["create", "read", "update", "delete", "list"]),
    nodeTypeId: z.string().optional(),
    projectId: z.string().optional(),
    name: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
    isSprintEligible: z.boolean().optional(),
    userId: z.string().optional(),
    confirmed: z.boolean().optional().default(false),
  },
  async ({ action, nodeTypeId, projectId, name, color, icon, isSprintEligible, userId, confirmed }) => {
    try {
      if (action === "list") {
        if (!projectId) throw new Error("projectId is required for list action");
        const nodeTypes = await prisma.nodeType.findMany({
          where: { projectId },
          orderBy: { createdAt: "desc" },
        });
        return { content: [{ type: "text", text: JSON.stringify(nodeTypes, null, 2) }] };
      }

      if (action === "read") {
        if (!nodeTypeId) throw new Error("nodeTypeId is required for read action");
        const nodeType = await prisma.nodeType.findUnique({ where: { id: nodeTypeId } });
        if (!nodeType) throw new Error("NodeType not found");
        return { content: [{ type: "text", text: JSON.stringify(nodeType, null, 2) }] };
      }

      if (!confirmed) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "pending_confirmation",
              message: `PROPOSED CHANGE: You are about to perform a '${action}' action on NodeType. Please confirm to apply these changes.`,
              proposedAction: { tool: "manage_node_types", action, params: { nodeTypeId, projectId, name, color, icon, isSprintEligible } }
            }, null, 2)
          }]
        };
      }

      if (action === "create") {
        if (!projectId) throw new Error("projectId is required for create action");
        if (!name) throw new Error("name is required for create action");
        if (!userId) throw new Error("userId is required for create action");

        const nodeType = await prisma.nodeType.create({
          data: {
            name,
            projectId,
            userId,
            color: color || "#3b82f6",
            icon: icon || "Target",
            isSprintEligible: isSprintEligible !== undefined ? isSprintEligible : true,
          }
        });
        return { content: [{ type: "text", text: `NodeType created successfully: ${nodeType.name} (ID: ${nodeType.id})` }] };
      }

      if (action === "update") {
        if (!nodeTypeId) throw new Error("nodeTypeId is required for update action");
        const data: any = {};
        if (name !== undefined) data.name = name;
        if (color !== undefined) data.color = color;
        if (icon !== undefined) data.icon = icon;
        if (isSprintEligible !== undefined) data.isSprintEligible = isSprintEligible;

        const nodeType = await prisma.nodeType.update({
          where: { id: nodeTypeId },
          data,
        });
        return { content: [{ type: "text", text: `NodeType updated successfully: ${nodeType.name}` }] };
      }

      if (action === "delete") {
        if (!nodeTypeId) throw new Error("nodeTypeId is required for delete action");
        await prisma.nodeType.delete({ where: { id: nodeTypeId } });
        return { content: [{ type: "text", text: `NodeType deleted successfully (ID: ${nodeTypeId})` }] };
      }

      throw new Error("Invalid action");
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error managing node type: ${e.message}` }], isError: true };
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
    confirmed: z.boolean().optional().default(false),
  },
  async ({ action, linkType, parentNodeId, childNodeId, blockedNodeId, blockingNodeId, confirmed }) => {
    try {
      if (action === "list") {
        if (linkType === "parent-child") {
          const links = await prisma.nodeLink.findMany();
          return { content: [{ type: "text", text: JSON.stringify(links, null, 2) }] };
        } else {
          const deps = await prisma.nodeDependency.findMany();
          return { content: [{ type: "text", text: JSON.stringify(deps, null, 2) }] };
        }
      }

      if (!confirmed) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              status: "pending_confirmation",
              message: `PROPOSED CHANGE: You are about to perform a '${action}' action on NodeLink (${linkType}). Please confirm to apply these changes.`,
              proposedAction: { tool: "manage_node_links", action, params: { linkType, parentNodeId, childNodeId, blockedNodeId, blockingNodeId } }
            }, null, 2)
          }]
        };
      }

      if (action === "create") {
        if (linkType === "parent-child") {
          if (!parentNodeId || !childNodeId) throw new Error("parentNodeId and childNodeId are required for parent-child link creation");
          const link = await prisma.nodeLink.create({
            data: { parentNodeId, childNodeId }
          });
          return { content: [{ type: "text", text: `Parent-Child link created successfully (ID: ${link.id})` }] };
        } else {
          if (!blockedNodeId || !blockingNodeId) throw new Error("blockedNodeId and blockingNodeId are required for dependency creation");
          const dep = await prisma.nodeDependency.create({
            data: { blockedNodeId, blockingNodeId }
          });
          return { content: [{ type: "text", text: `Dependency link created successfully (ID: ${dep.id})` }] };
        }
      }

      if (action === "delete") {
        if (linkType === "parent-child") {
          if (!parentNodeId || !childNodeId) throw new Error("parentNodeId and childNodeId are required for parent-child link deletion");
          await prisma.nodeLink.delete({
            where: { parentNodeId_childNodeId: { parentNodeId, childNodeId } }
          });
          return { content: [{ type: "text", text: `Parent-Child link deleted successfully` }] };
        } else {
          if (!blockedNodeId || !blockingNodeId) throw new Error("blockedNodeId and blockingNodeId are required for dependency deletion");
          await prisma.nodeDependency.delete({
            where: { blockedNodeId_blockingNodeId: { blockedNodeId, blockingNodeId } }
          });
          return { content: [{ type: "text", text: `Dependency link deleted successfully` }] };
        }
      }

      throw new Error("Invalid action");
    } catch (e: any) {
      return { content: [{ type: "text", text: `Error managing node link: ${e.message}` }], isError: true };
    }
  }
);

const app = express();
app.use(cors());

let transport: SSEServerTransport | null = null;

app.get("/sse", async (req, res) => {
  transport = new SSEServerTransport("/message", res);
  await server.connect(transport);
});

app.post("/message", async (req, res) => {
  if (!transport) {
    res.status(400).send("SSE connection not established");
    return;
  }
  await transport.handlePostMessage(req, res);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`QuickPlanner MCP Server running on port ${PORT}`);
});
