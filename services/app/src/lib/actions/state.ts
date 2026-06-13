import { apiFetch } from "@/context/AuthContext";

export async function updateNodeStatus(projectId: string, id: string, status: string) {
  return apiFetch(`/projects/${projectId}/nodes/${id}`, {
    method: "PUT",
    body: JSON.stringify({ status }),
  });
}
