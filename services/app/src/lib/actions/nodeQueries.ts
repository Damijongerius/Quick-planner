import { apiFetch } from "@/context/AuthContext";
import { Node } from "@/lib/types";

export async function getNode(projectId: string, id: string): Promise<Node | null> {
  try {
    return await apiFetch(`/projects/${projectId}/nodes/${id}`);
  } catch (error) {
    console.error("Get node error:", error);
    return null;
  }
}

export async function getNodeChildren(projectId: string, nodeId: string): Promise<Node[]> {
  try {
    return await apiFetch(`/projects/${projectId}/nodes/${nodeId}/children`);
  } catch (error) {
    console.error("Get node children error:", error);
    return [];
  }
}

export async function getRootNodes(projectId: string, showArchived: boolean = false): Promise<Node[]> {
  try {
    return await apiFetch(`/projects/${projectId}/nodes-root?showArchived=${showArchived}`);
  } catch (error) {
    console.error("Get root nodes error:", error);
    return [];
  }
}

export async function getAllNodes(projectId: string): Promise<Node[]> {
  try {
    return await apiFetch(`/projects/${projectId}/nodes`);
  } catch (error) {
    console.error("Get all nodes error:", error);
    return [];
  }
}
