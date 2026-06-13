export const blueprintTools = [
  {
    type: "function",
    function: {
      name: "get_blueprint",
      description: "Retrieve all blueprints in the project, including their IDs, names, colors, icons, configuration, and custom field/property definitions.",
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
      name: "add_dependency",
      description: "Add a dependency link (e.g. blockingNode blocks blockedNode).",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          blockedNodeId: { type: "string", description: "The ID of the node that is blocked." },
          blockedNodeTitle: { type: "string", description: "The title of the blocked node, for user-facing confirmation." },
          blockingNodeId: { type: "string", description: "The ID of the node that blocks it." },
          blockingNodeTitle: { type: "string", description: "The title of the blocking node, for user-facing confirmation." }
        },
        required: ["projectId", "blockedNodeId", "blockingNodeId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "remove_dependency",
      description: "Remove a dependency link between two nodes.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          dependencyId: { type: "string", description: "The dependency link ID to remove." }
        },
        required: ["projectId", "dependencyId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "delete_blueprint",
      description: "Delete a blueprint from a project.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          blueprintId: { type: "string", description: "The ID of the blueprint to delete." },
          blueprintName: { type: "string", description: "The name of the blueprint to delete, for user-facing confirmation." }
        },
        required: ["projectId", "blueprintId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_blueprint",
      description: "Create a new blueprint in a project (e.g. Legendary, Bug, Task).",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          name: { type: "string", description: "The name of the new blueprint." },
          color: { type: "string", description: "Optional hexadecimal color code for this blueprint (e.g. #ff0000)." },
          icon: { type: "string", description: "Optional icon name (e.g. Target, Rocket, Play, Shield, Calendar)." }
        },
        required: ["projectId", "name"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "update_blueprint",
      description: "Update the configuration of an existing blueprint (such as renaming it, changing its color, icon, or sprint eligibility).",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          blueprintId: { type: "string", description: "The ID of the blueprint to update." },
          blueprintName: { type: "string", description: "The current name of the blueprint, for user-facing confirmation." },
          name: { type: "string", description: "Optional new name." },
          color: { type: "string", description: "Optional new hexadecimal color code." },
          icon: { type: "string", description: "Optional new icon name." },
          isSprintEligible: { type: "boolean", description: "Optional flag for sprint eligibility." }
        },
        required: ["projectId", "blueprintId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "connect_blueprint",
      description: "Connect a parent blueprint type to a child blueprint type (establish an allowed relation link) in the node Blueprints.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          parentBlueprintId: { type: "string", description: "The parent blueprint (source) ID." },
          parentBlueprintName: { type: "string", description: "The name of the parent blueprint (for user feedback)." },
          childBlueprintId: { type: "string", description: "The child blueprint (target) ID." },
          childBlueprintName: { type: "string", description: "The name of the child blueprint (for user feedback)." }
        },
        required: ["projectId", "parentBlueprintId", "childBlueprintId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "disconnect_blueprint",
      description: "Disconnect a relation link between a parent blueprint and a child blueprint.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          parentBlueprintId: { type: "string", description: "The parent blueprint ID." },
          parentBlueprintName: { type: "string", description: "The name of the parent blueprint (for user feedback)." },
          childBlueprintId: { type: "string", description: "The child blueprint ID." },
          childBlueprintName: { type: "string", description: "The name of the child blueprint (for user feedback)." }
        },
        required: ["projectId", "parentBlueprintId", "childBlueprintId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "define_blueprint_field",
      description: "Define a new property field (attribute) for a blueprint (e.g. TEXT, NUMBER, DATE, CHECKBOX, or SELECT with options).",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "The project ID." },
          blueprintId: { type: "string", description: "The blueprint (node type) ID." },
          blueprintName: { type: "string", description: "The name of the blueprint (for user feedback)." },
          name: { type: "string", description: "The name of the field/attribute (e.g., Priority, Due Date)." },
          type: { type: "string", enum: ["TEXT", "NUMBER", "DATE", "CHECKBOX", "SELECT"], description: "The type of the field." },
          options: {
            type: "array",
            items: { type: "string" },
            description: "Optional array of string options (only applicable for SELECT field type)."
          }
        },
        required: ["projectId", "blueprintId", "name", "type"]
      }
    }
  }
];
