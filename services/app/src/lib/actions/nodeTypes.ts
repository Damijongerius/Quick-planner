import { apiFetch } from "@/context/AuthContext";
import { NodeType, BoardConfig } from "@/lib/types";

export async function createNodeType(projectId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const color = formData.get("color") as string;
  const icon = (formData.get("icon") as string) || "Target";

  return apiFetch(`/projects/${projectId}/node-types`, {
    method: "POST",
    body: JSON.stringify({ name, color, icon }),
  });
}

export async function updateNodeType(
  projectId: string,
  id: string,
  name: string,
  color: string,
  icon: string,
  isSprintEligible: boolean = true
) {
  return apiFetch(`/projects/${projectId}/node-types/${id}`, {
    method: "PUT",
    body: JSON.stringify({ name, color, icon, isSprintEligible }),
  });
}

export async function deleteNodeType(projectId: string, id: string) {
  return apiFetch(`/projects/${projectId}/node-types/${id}`, {
    method: "DELETE",
  });
}

export async function addFieldDefinition(
  projectId: string,
  nodeTypeId: string,
  name: string,
  type: string,
  options?: any[]
) {
  return apiFetch(`/projects/${projectId}/node-types/${nodeTypeId}/fields`, {
    method: "POST",
    body: JSON.stringify({ name, type, options }),
  });
}

export async function removeFieldDefinition(projectId: string, id: string) {
  return apiFetch(`/projects/${projectId}/fields/${id}`, {
    method: "DELETE",
  });
}

export async function getNodeTypes(projectId: string): Promise<NodeType[]> {
  try {
    return await apiFetch(`/projects/${projectId}/node-types`);
  } catch (error) {
    console.error("Get node types error:", error);
    return [];
  }
}

export async function updateNodeTypeBoardConfig(
  projectId: string,
  id: string,
  boardConfig: BoardConfig
) {
  return apiFetch(`/projects/${projectId}/node-types/${id}/board-config`, {
    method: "PUT",
    body: JSON.stringify({ boardConfig }),
  });
}
