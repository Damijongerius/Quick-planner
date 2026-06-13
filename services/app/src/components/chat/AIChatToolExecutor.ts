import { getProjects, deleteProject } from "@/lib/actions/projects";
import { getRootNodes, getAllNodes } from "@/lib/actions/nodeQueries";
import { createNode, updateNode, deleteNode } from "@/lib/actions/nodes";
import { getSprints, createSprint, assignNodeToSprint, deleteSprint } from "@/lib/actions/sprints";
import { getNodeTypes, deleteNodeType, createNodeType, addFieldDefinition, updateNodeType } from "@/lib/actions/nodeTypes";
import { addDependency, removeDependency, getRelations, createRelation, deleteRelation } from "@/lib/actions/relations";
import { getOptionColor } from "@/lib/utils/colorUtils";
import { writeTools } from "./AIChatHelpers";

export async function executeTool(name: string, args: any, projectId?: string) {
  if (projectId && name !== "delete_project") {
    args.projectId = projectId;
  }

  const res = await executeToolInner(name, args);
  if (res.success && writeTools.includes(name)) {
    window.dispatchEvent(new CustomEvent("project-mutated"));
  }
  return res;
}

async function executeToolInner(name: string, args: any) {
  const resolveBlueprintId = async (idOrName: string): Promise<string> => {
    if (!idOrName) return idOrName;
    try {
      const blueprints = await getNodeTypes(args.projectId);
      const found = blueprints.find(
        b => b.id === idOrName || b.name.toLowerCase() === idOrName.toLowerCase()
      );
      return found ? found.id : idOrName;
    } catch (_) {
      return idOrName;
    }
  };

  try {
    switch (name) {
      case "get_projects": {
        const data = await getProjects();
        return { success: true, data };
      }
      case "get_root_nodes": {
        const data = await getRootNodes(args.projectId);
        return { success: true, data };
      }
      case "get_all_nodes": {
        const data = await getAllNodes(args.projectId);
        return { success: true, data };
      }
      case "create_node": {
        const blueprintId = await resolveBlueprintId(args.blueprintId || args.nodeTypeId);
        const data = await createNode(args.projectId, args.parentNodeId || null, blueprintId, args.title, {}, args.sprintId || null);
        return { success: true, data };
      }
      case "update_node": {
        const { projectId, nodeId, sprintId, nodeTitle, sprintName, ...nodeUpdates } = args;
        const data = await updateNode(projectId, nodeId, nodeUpdates);
        if (sprintId !== undefined) {
          await assignNodeToSprint(projectId, nodeId, sprintId);
        }
        return { success: true, data };
      }
      case "delete_node": {
        const data = await deleteNode(args.projectId, args.nodeId);
        return { success: true, data };
      }
      case "get_sprints": {
        const data = await getSprints(args.projectId);
        return { success: true, data };
      }
      case "create_sprint": {
        const data = await createSprint(args.projectId, args.name, args.startDate, args.endDate);
        return { success: true, data };
      }
      case "get_blueprint": {
        const data = await getNodeTypes(args.projectId);
        return { success: true, data };
      }
      case "add_dependency": {
        const data = await addDependency(args.projectId, args.blockedNodeId, args.blockingNodeId);
        return { success: true, data };
      }
      case "remove_dependency": {
        const data = await removeDependency(args.projectId, args.dependencyId);
        return { success: true, data };
      }
      case "delete_project": {
        const data = await deleteProject(args.projectId);
        return { success: true, data };
      }
      case "delete_sprint": {
        const data = await deleteSprint(args.projectId, args.sprintId);
        return { success: true, data };
      }
      case "delete_blueprint": {
        const blueprintId = await resolveBlueprintId(args.blueprintId || args.nodeTypeId);
        const data = await deleteNodeType(args.projectId, blueprintId);
        return { success: true, data };
      }
      case "create_blueprint": {
        const formData = new FormData();
        formData.append("name", args.name);
        if (args.color) formData.append("color", args.color);
        if (args.icon) formData.append("icon", args.icon);
        const data = await createNodeType(args.projectId, formData);
        return { success: true, data };
      }
      case "update_blueprint": {
        const blueprintId = await resolveBlueprintId(args.blueprintId || args.nodeTypeId);
        const blueprints = await getNodeTypes(args.projectId);
        const current = blueprints.find(b => b.id === blueprintId);
        if (!current) return { success: false, error: `Blueprint not found with ID: ${blueprintId}` };
        
        const name = args.name !== undefined ? args.name : current.name;
        const color = args.color !== undefined ? args.color : current.color;
        const icon = args.icon !== undefined ? args.icon : current.icon;
        const isSprintEligible = args.isSprintEligible !== undefined ? args.isSprintEligible : current.isSprintEligible;

        const data = await updateNodeType(args.projectId, blueprintId, name, color, icon, isSprintEligible);
        return { success: true, data };
      }
      case "connect_blueprint": {
        const parentBlueprintId = await resolveBlueprintId(args.parentBlueprintId || args.parentNodeTypeId);
        const childBlueprintId = await resolveBlueprintId(args.childBlueprintId || args.childNodeTypeId);
        const data = await createRelation(args.projectId, parentBlueprintId, childBlueprintId);
        return { success: true, data };
      }
      case "disconnect_blueprint": {
        const relations = await getRelations(args.projectId);
        const parentId = await resolveBlueprintId(args.parentBlueprintId || args.parentNodeTypeId);
        const childId = await resolveBlueprintId(args.childBlueprintId || args.childNodeTypeId);
        const match = relations.find(r => r.parentNodeTypeId === parentId && r.childNodeTypeId === childId);
        if (match) {
          const data = await deleteRelation(args.projectId, match.id);
          return { success: true, data };
        }
        return { success: false, error: "No connection link exists between these blueprints." };
      }
      case "define_blueprint_field": {
        const blueprintId = await resolveBlueprintId(args.blueprintId || args.nodeTypeId);
        const optionsArray = args.type === "SELECT" && args.options
          ? args.options.map((o: string) => ({ value: o, color: getOptionColor(o) }))
          : undefined;
        const data = await addFieldDefinition(args.projectId, blueprintId, args.name, args.type, optionsArray);
        return { success: true, data };
      }
      default:
        throw new Error(`Unknown tool name: ${name}`);
    }
  } catch (error: any) {
    console.error(`Error running tool ${name}:`, error);
    return { success: false, error: error.message || String(error) };
  }
}
