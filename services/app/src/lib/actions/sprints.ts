import { apiFetch } from "@/context/AuthContext";
import { Sprint } from "@/lib/types";

export async function createSprint(
  projectId: string,
  name: string,
  startDate?: string,
  endDate?: string
): Promise<Sprint> {
  return apiFetch(`/projects/${projectId}/sprints`, {
    method: "POST",
    body: JSON.stringify({ name, startDate, endDate }),
  });
}

export async function getSprints(projectId: string): Promise<(Sprint & { _count: { nodes: number } })[]> {
  try {
    return await apiFetch(`/projects/${projectId}/sprints`);
  } catch (error) {
    console.error("Get sprints error:", error);
    return [];
  }
}

export async function updateSprintStatus(projectId: string, id: string, status: string) {
  return apiFetch(`/projects/${projectId}/sprints/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}

export async function deleteSprint(projectId: string, id: string) {
  return apiFetch(`/projects/${projectId}/sprints/${id}`, {
    method: "DELETE",
  });
}

export async function assignNodeToSprint(projectId: string, nodeId: string, sprintId: string | null) {
  return apiFetch(`/projects/${projectId}/nodes/${nodeId}/sprint`, {
    method: "PUT",
    body: JSON.stringify({ sprintId }),
  });
}
