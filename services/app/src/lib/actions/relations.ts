import { apiFetch } from "@/context/AuthContext";
import { AllowedRelation } from "@/lib/types";

export async function createRelation(
  projectId: string,
  parentNodeTypeId: string,
  childNodeTypeId: string
) {
  return apiFetch(`/projects/${projectId}/relations`, {
    method: "POST",
    body: JSON.stringify({ parentNodeTypeId, childNodeTypeId }),
  });
}

export async function deleteRelation(projectId: string, id: string) {
  return apiFetch(`/projects/${projectId}/relations/${id}`, {
    method: "DELETE",
  });
}

export async function getRelations(projectId: string): Promise<AllowedRelation[]> {
  try {
    return await apiFetch(`/projects/${projectId}/relations`);
  } catch (error) {
    console.error("Get relations error:", error);
    return [];
  }
}

export async function addDependency(projectId: string, blockedNodeId: string, blockingNodeId: string) {
  return apiFetch(`/projects/${projectId}/dependencies`, {
    method: "POST",
    body: JSON.stringify({ blockedNodeId, blockingNodeId }),
  });
}

export async function removeDependency(projectId: string, id: string) {
  return apiFetch(`/projects/${projectId}/dependencies/${id}`, {
    method: "DELETE",
  });
}
