import { NodeType, AllowedRelation } from "./types";
import { Node } from "reactflow";

export function calculateHierarchicalLayout(nodeTypes: NodeType[], relations: AllowedRelation[]): Node[] {
  const depths: Record<string, number> = {};
  nodeTypes.forEach((t) => depths[t.id] = 0);
  
  let changed = true;
  let iterations = 0;
  while (changed && iterations < 10) {
    changed = false;
    iterations++;
    relations.forEach((rel) => {
      const parentDepth = depths[rel.parentNodeTypeId];
      if (depths[rel.childNodeTypeId] <= parentDepth) {
        depths[rel.childNodeTypeId] = parentDepth + 1;
        changed = true;
      }
    });
  }

  const nodesByDepth: Record<number, string[]> = {};
  Object.entries(depths).forEach(([id, depth]) => {
    if (!nodesByDepth[depth]) nodesByDepth[depth] = [];
    nodesByDepth[depth].push(id);
  });

  return nodeTypes.map((type) => {
    const depth = depths[type.id];
    const nodesAtThisDepth = nodesByDepth[depth];
    const horizontalIndex = nodesAtThisDepth.indexOf(type.id);
    const horizontalOffset = (nodesAtThisDepth.length - 1) * 150;

    return {
      id: type.id,
      type: 'nodeType',
      data: { 
        label: type.name.toUpperCase(), 
        color: type.color, 
        icon: type.icon || 'Target',
      },
      position: { 
        x: (horizontalIndex * 350) - horizontalOffset, 
        y: depth * 200 
      },
    };
  });
}
