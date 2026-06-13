import { apiFetch } from "@/context/AuthContext";
import { Project } from "@/lib/types";

export async function getProjects(): Promise<Project[]> {
  return apiFetch("/projects");
}

export async function getProject(id: string) {
  return apiFetch(`/projects/${id}`);
}

export async function createProject(name: string) {
  return apiFetch("/projects", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function deleteProject(id: string) {
  return apiFetch(`/projects/${id}`, {
    method: "DELETE",
  });
}

export async function archiveProject(id: string) {
  return apiFetch(`/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify({ isArchived: true }),
  });
}

export async function unarchiveProject(id: string) {
  return apiFetch(`/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify({ isArchived: false }),
  });
}

export async function getProjectHistory(projectId: string) {
  return apiFetch(`/projects/${projectId}/history`);
}

export async function getHistoryForNode(projectId: string, nodeId: string) {
  return apiFetch(`/projects/${projectId}/nodes/${nodeId}/history`);
}
