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
