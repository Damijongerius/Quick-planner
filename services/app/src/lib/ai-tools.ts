import { tool } from 'ai';
import * as z from 'zod';
import { 
    getAllNodes, 
    getSprints, 
    createNode, 
    updateNode, 
    assignNodeToSprint,
    getNodeTypes,
    getRelations,
    createRelation,
    deleteRelation
} from '@/lib/actions';

export const getProjectTools = (projectId: string) => ({
  getProjectMetadata: tool({
    description: 'Get project metadata including available Node Types and allowed Relations between them.',
    parameters: z.object({}),
    execute: async () => {
      const [nodeTypes, relations] = await Promise.all([
        getNodeTypes(projectId),
        getRelations(projectId)
      ]);
      return { nodeTypes, relations };
    },
  }),

  getProjectData: tool({
    description: 'Get all nodes and sprints for the current project',
    parameters: z.object({}),
    execute: async () => {
      const [nodes, sprints] = await Promise.all([
        getAllNodes(projectId),
        getSprints(projectId)
      ]);
      return { nodes, sprints };
    },
  }),
  
  searchWeb: tool({
    description: 'Search the internet for information',
    parameters: z.object({
      query: z.string(),
    }),
    execute: async ({ query }) => {
      const formData = new URLSearchParams();
      formData.append('q', query);
      const response = await fetch("https://lite.duckduckgo.com/lite/", {
        method: 'POST',
        headers: { 
            "User-Agent": "Mozilla/5.0",
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formData
      });
      const html = await response.text();
      const denseHtml = html
          .replace(/<(script|style|svg|head|form)[^>]*>[\s\S]*?<\/\1>/gi, '')
          .replace(/<[^>]+>/g, m => (m.toLowerCase().startsWith('<a ') || m.toLowerCase() === '</a>') ? m : ' ')
          .replace(/\s+/g, ' ').trim();
      return { results: denseHtml.substring(0, 20000) };
    },
  }),
  
  createNode: tool({
    description: 'Create a new strategic node (Task, Epic, etc.) in the project',
    parameters: z.object({
      title: z.string(),
      parentNodeId: z.string().optional().nullable(),
      nodeTypeId: z.string(),
      content: z.any().optional(),
    }),
    execute: async ({ title, parentNodeId, nodeTypeId, content }) => {
      const node = await createNode(projectId, parentNodeId || null, nodeTypeId, title, content || {});
      return { success: true, nodeId: node.id, title: node.title };
    },
  }),
  
  updateNode: tool({
    description: 'Update an existing node (title, status, description, etc.)',
    parameters: z.object({
      id: z.string(),
      updates: z.object({
        title: z.string().optional(),
        status: z.string().optional(),
        isArchived: z.boolean().optional(),
        content: z.any().optional(),
      }),
    }),
    execute: async ({ id, updates }) => {
      await updateNode(projectId, id, updates);
      return { success: true, nodeId: id };
    },
  }),
  
  manageRelations: tool({
    description: 'Create or delete allowed relations between node types',
    parameters: z.object({
      action: z.enum(['create', 'delete']),
      parentNodeTypeId: z.string(),
      childNodeTypeId: z.string(),
      relationId: z.string().optional(),
    }),
    execute: async ({ action, parentNodeTypeId, childNodeTypeId, relationId }) => {
      if (action === 'create') {
        await createRelation(projectId, parentNodeTypeId, childNodeTypeId);
      } else if (action === 'delete' && relationId) {
        await deleteRelation(projectId, relationId);
      }
      return { success: true };
    },
  }),
  
  assignToSprint: tool({
    description: 'Assign a node to a specific sprint',
    parameters: z.object({
      nodeId: z.string(),
      sprintId: z.string().nullable(),
    }),
    execute: async ({ nodeId, sprintId }) => {
      await assignNodeToSprint(projectId, nodeId, sprintId);
      return { success: true, nodeId };
    },
  }),
});
