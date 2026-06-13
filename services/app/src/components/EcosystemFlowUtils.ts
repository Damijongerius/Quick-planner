import { MarkerType, Edge } from 'reactflow';
import { NodeType, AllowedRelation } from '@/lib/types';

export function transformToFlowNodes(
  nodeTypes: NodeType[], 
  relations: AllowedRelation[], 
  setActiveNodeType: (type: NodeType | null) => void,
  projectId: string,
  isReadOnly: boolean
) {
  // 1. Calculate depths
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

  // 2. Group nodes by depth
  const nodesByDepth: Record<number, string[]> = {};
  Object.entries(depths).forEach(([id, depth]) => {
    if (!nodesByDepth[depth]) nodesByDepth[depth] = [];
    nodesByDepth[depth].push(id);
  });

  const flowNodes: any[] = [];
  const uniqueDepths = Array.from(new Set(Object.values(depths))).sort((a, b) => a - b);

  // 3. Create Layer Box background nodes (render first so they are behind)
  uniqueDepths.forEach((d) => {
    const nodeTypesAtDepth = nodeTypes.filter((t) => depths[t.id] === d);
    if (nodeTypesAtDepth.length === 0) return;

    // Determine visibility settings for this layer by checking the first node type in it
    const firstType = nodeTypesAtDepth[0];
    const isSprintEligible = firstType?.isSprintEligible ?? false;
    const boardConfig = firstType?.boardConfig || {};
    const showOnKanban = boardConfig.showOnKanban !== false;
    const showOnGantt = boardConfig.showOnGantt !== false;

    flowNodes.push({
      id: `layer-box-${d}`,
      type: 'layerBox',
      draggable: false,
      selectable: false,
      position: {
        x: -850,
        y: d * 260 - 40
      },
      data: {
        depth: d,
        label: nodeTypesAtDepth.map((t) => t.name.toUpperCase()).join(' / '),
        projectId,
        isReadOnly,
        isSprintEligible,
        showOnKanban,
        showOnGantt,
        nodeTypesData: nodeTypesAtDepth.map((t) => ({
          id: t.id,
          boardConfig: t.boardConfig || {}
        }))
      }
    });
  });

  // 4. Create actual node type cards (render on top of background boxes)
  nodeTypes.forEach((type) => {
    const depth = depths[type.id];
    const nodesAtThisDepth = nodesByDepth[depth];
    const horizontalIndex = nodesAtThisDepth.indexOf(type.id);
    const horizontalOffset = (nodesAtThisDepth.length - 1) * 175;

    flowNodes.push({
      id: type.id,
      type: 'nodeType',
      position: { 
        x: (horizontalIndex * 350) - horizontalOffset, 
        y: depth * 260 
      },
      data: { 
        label: type.name.toUpperCase(), 
        color: type.color, 
        icon: type.icon || 'Target',
        fields: type.fields || [],
        onClick: () => setActiveNodeType(type) 
      }
    });
  });

  return flowNodes;
}

export function transformToFlowEdges(relations: AllowedRelation[]): Edge[] {
  return relations.map((rel) => ({
    id: rel.id, source: rel.parentNodeTypeId, target: rel.childNodeTypeId, animated: true,
    markerEnd: { type: MarkerType.ArrowClosed, color: 'var(--primary)', width: 20, height: 20 },
    style: { stroke: 'var(--primary)', strokeWidth: 2, opacity: 0.4 }
  }));
}
