import { Node, NodeType, Sprint } from "./types";

export function getActiveSprint(sprints: Sprint[], selectedSprintId: string | null) {
  return sprints.find((s) => s.id === selectedSprintId) || sprints[0];
}

export function getFilteredNodes(nodes: Node[], viewMode: string, selectedSprintId: string | null, selectedNodeTypeIds: string[]) {
  return nodes.filter((node) => {
    const boardConfig = node.type?.boardConfig;
    if (viewMode === 'KANBAN' && boardConfig?.showOnKanban === false) return false;
    if (viewMode === 'GANTT' && boardConfig?.showOnGantt === false) return false;

    const isSprintEligible = node.type?.isSprintEligible;
    const nodeSprintId = node.sprintId;
    const parentSprintId = node.parentLinks?.[0]?.parentNode?.sprintId;
    
    const matchesSprint = viewMode === 'GANTT' ||
                          !selectedSprintId || 
                          nodeSprintId === selectedSprintId || 
                          parentSprintId === selectedSprintId;

    const matchesType = selectedNodeTypeIds.length === 0 || selectedNodeTypeIds.includes(node.nodeTypeId);
    
    return matchesSprint && matchesType && !node.isArchived;
  });
}

export function getSortedNodes(nodes: Node[], nodeTypes: NodeType[]) {
  return [...nodes].sort((a, b) => {
    const indexA = nodeTypes.findIndex((t) => t.id === a.nodeTypeId);
    const indexB = nodeTypes.findIndex((t) => t.id === b.nodeTypeId);
    return indexA - indexB;
  });
}

export function findNodeById(nodes: Node[], id: string) {
  return nodes.find((n) => n.id === id);
}
