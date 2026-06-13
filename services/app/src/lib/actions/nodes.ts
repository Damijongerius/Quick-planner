import { apiFetch } from "@/context/AuthContext";

export async function createNode(
  projectId: string,
  parentNodeId: string | null,
  nodeTypeId: string,
  title: string,
  content: Record<string, unknown> = {},
  sprintId?: string | null
) {
  return apiFetch(`/projects/${projectId}/nodes`, {
    method: "POST",
    body: JSON.stringify({
      parentNodeId,
      nodeTypeId,
      title,
      content,
      sprintId,
    }),
  });
}

export async function updateNode(
  projectId: string,
  id: string,
  updates: {
    title?: string;
    description?: string;
    content?: Record<string, unknown>;
    status?: string;
    isArchived?: boolean;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
  }
) {
  return apiFetch(`/projects/${projectId}/nodes/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteNode(projectId: string, id: string) {
  return apiFetch(`/projects/${projectId}/nodes/${id}`, {
    method: "DELETE",
  });
}

export async function archiveNode(
  projectId: string,
  id: string,
  isArchived: boolean,
  archiveChildren: boolean = false
) {
  return apiFetch(`/projects/${projectId}/nodes/${id}/archive`, {
    method: "PUT",
    body: JSON.stringify({ isArchived, archiveChildren }),
  });
}

export async function updateNodeParent(
  projectId: string,
  nodeId: string,
  newParentNodeId: string | null
) {
  return apiFetch(`/projects/${projectId}/nodes/${nodeId}/parent`, {
    method: "PUT",
    body: JSON.stringify({ newParentNodeId }),
  });
}
