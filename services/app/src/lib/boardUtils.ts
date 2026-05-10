export function getActiveSprint(sprints: any[], selectedSprintId: string | null) {
  return sprints.find((s: any) => s.id === selectedSprintId) || sprints[0];
}

export function getFilteredNodes(nodes: any[], viewMode: string, selectedSprintId: string | null, selectedNodeTypeIds: string[]) {
  return nodes.filter((node: any) => {
    const boardConfig = node.type?.boardConfig;
    if (viewMode === 'KANBAN' && boardConfig?.showOnKanban === false) return false;
    if (viewMode === 'GANTT' && boardConfig?.showOnGantt === false) return false;

    const isSprintEligible = node.type?.isSprintEligible;
    const nodeSprintId = node.sprintId;
    const parentSprintId = node.parentLinks?.[0]?.parentNode?.sprintId;
    
    const matchesSprint = !selectedSprintId || 
                          nodeSprintId === selectedSprintId || 
                          parentSprintId === selectedSprintId ||
                          (viewMode === 'GANTT' && !isSprintEligible);

    const matchesType = selectedNodeTypeIds.length === 0 || selectedNodeTypeIds.includes(node.nodeTypeId);
    
    return matchesSprint && matchesType && !node.isArchived;
  });
}

export function getSortedNodes(nodes: any[], nodeTypes: any[]) {
  return [...nodes].sort((a, b) => {
    const indexA = nodeTypes.findIndex((t: any) => t.id === a.nodeTypeId);
    const indexB = nodeTypes.findIndex((t: any) => t.id === b.nodeTypeId);
    return indexA - indexB;
  });
}

export function findNodeById(nodes: any[], id: string) {
  return nodes.find((n: any) => n.id === id);
}
