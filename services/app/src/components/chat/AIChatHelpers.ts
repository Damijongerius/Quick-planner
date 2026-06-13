export const writeTools = [
  "delete_project",
  "create_node",
  "update_node",
  "delete_node",
  "create_sprint",
  "delete_sprint",
  "delete_blueprint",
  "create_blueprint",
  "update_blueprint",
  "add_dependency",
  "remove_dependency",
  "connect_blueprint",
  "disconnect_blueprint",
  "define_blueprint_field"
];

export function getHumanReadableAction(name: string, args: any): string {
  switch (name) {
    case "delete_project":
      return `Delete project "${args.projectName || args.projectId}"`;
    case "create_node":
      return `Create planning item "${args.title || 'Untitled'}"`;
    case "update_node": {
      const updates = [];
      if (args.title) updates.push(`title: "${args.title}"`);
      if (args.status) updates.push(`status: ${args.status}`);
      if (args.sprintId !== undefined) {
        updates.push(args.sprintId === null ? "move to backlog" : `assign to sprint "${args.sprintName || args.sprintId}"`);
      }
      return `Update planning item "${args.nodeTitle || args.nodeId}" (${updates.join(", ") || 'modify properties'})`;
    }
    case "delete_node":
      return `Delete planning item "${args.nodeTitle || args.nodeId}"`;
    case "create_sprint":
      return `Create sprint "${args.name}"`;
    case "delete_sprint":
      return `Delete sprint "${args.sprintName || args.sprintId}"`;
    case "delete_blueprint":
      return `Remove blueprint "${args.blueprintName || args.blueprintId || args.nodeTypeName || args.nodeTypeId}"`;
    case "create_blueprint":
      return `Create blueprint "${args.name}"`;
    case "update_blueprint": {
      const updates = [];
      if (args.name) updates.push(`name: "${args.name}"`);
      if (args.color) updates.push(`color: ${args.color}`);
      if (args.icon) updates.push(`icon: ${args.icon}`);
      if (args.isSprintEligible !== undefined) updates.push(`sprint eligibility: ${args.isSprintEligible}`);
      return `Update blueprint "${args.blueprintName || args.blueprintId || args.nodeTypeName || args.nodeTypeId}" (${updates.join(", ") || 'modify configuration'})`;
    }
    case "connect_blueprint":
      return `Connect blueprint "${args.parentBlueprintName || args.parentBlueprintId || args.parentNodeTypeName || args.parentNodeTypeId}" → "${args.childBlueprintName || args.childBlueprintId || args.childNodeTypeName || args.childNodeTypeId}"`;
    case "disconnect_blueprint":
      return `Disconnect blueprint link "${args.parentBlueprintName || args.parentBlueprintId || args.parentNodeTypeName || args.parentNodeTypeId}" ↛ "${args.childBlueprintName || args.childBlueprintId || args.childNodeTypeName || args.childNodeTypeId}"`;
    case "define_blueprint_field":
      return `Define field "${args.name}" (${args.type}) on blueprint "${args.blueprintName || args.blueprintId || args.nodeTypeName || args.nodeTypeId}"`;
    case "add_dependency":
      return `Add dependency link: item "${args.blockedNodeTitle || args.blockedNodeId}" is blocked by "${args.blockingNodeTitle || args.blockingNodeId}"`;
    case "remove_dependency":
      return `Remove dependency link (ID: ${args.dependencyId})`;
    default:
      return `Execute operation: ${name}`;
  }
}
