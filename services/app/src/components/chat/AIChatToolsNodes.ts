export const nodeTools = [
  {
    type: "function",
    function: {
      name: "get_projects",
      description: "Retrieve the list of all projects.",
      parameters: { type: "object", properties: {} }
    }
  },
  {
    type: "function",
    function: {
      name: "get_root_nodes",
      description: "Retrieve root planning nodes for a project.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_all_nodes",
      description: "Retrieve all planning nodes for a project (including hierarchy, types, statuses).",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_node",
      description: "Create a new planning node (like Epic, Story, Task) in the project.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          blueprintId: { type: "string", description: "The ID of the blueprint (e.g. Epic, Story, Task)." },
          title: { type: "string", description: "The title/name of the planning node." },
          parentNodeId: { type: "string", description: "Optional parent node ID if nesting." },
          sprintId: { type: "string", description: "Optional sprint ID to assign to." }
        },
        required: ["projectId", "blueprintId", "title"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_node",
      description: "Update fields of a planning node (such as status, title, description, start/end dates).",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          nodeId: { type: "string", description: "The ID of the node to update." },
          nodeTitle: { type: "string", description: "The current title of the node being updated, for user-facing confirmation." },
          title: { type: "string", description: "Optional new title." },
          description: { type: "string", description: "Optional new description." },
          status: { type: "string", description: "Optional new status (e.g. TODO, IN_PROGRESS, DONE)." },
          sprintId: { type: "string", description: "Optional new sprint ID or null to move to backlog." },
          sprintName: { type: "string", description: "Optional name of the target sprint if assigning, for user-facing confirmation." },
          startDate: { type: "string", description: "Optional start date (ISO string)." },
          endDate: { type: "string", description: "Optional end date (ISO string)." },
          isArchived: { type: "boolean", description: "Optional archive status." }
        },
        required: ["projectId", "nodeId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_node",
      description: "Delete a planning node.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          nodeId: { type: "string", description: "The ID of the node to delete." },
          nodeTitle: { type: "string", description: "The title of the node being deleted, for user-facing confirmation." }
        },
        required: ["projectId", "nodeId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_sprints",
      description: "Retrieve all sprints for a project.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_sprint",
      description: "Create a new sprint in the project.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          name: { type: "string", description: "The name of the sprint." },
          startDate: { type: "string", description: "Optional start date (ISO string)." },
          endDate: { type: "string", description: "Optional end date (ISO string)." }
        },
        required: ["projectId", "name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_project",
      description: "Delete a project from the application.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The ID of the project to delete." },
          projectName: { type: "string", description: "The name of the project to delete, for user-facing confirmation." }
        },
        required: ["projectId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_sprint",
      description: "Delete a sprint from a project.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          sprintId: { type: "string", description: "The ID of the sprint to delete." },
          sprintName: { type: "string", description: "The name of the sprint to delete, for user-facing confirmation." }
        },
        required: ["projectId", "sprintId"]
      }
    }
  }
];
