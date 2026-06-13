import { useMemo, useState } from "react";
import { NodeType } from "@/lib/types";

export function useBoardLevels(filteredNodeTypes: NodeType[]) {
  const availableLevels = useMemo(() => {
    // 1. Calculate depths using topological sort
    const depths: Record<string, number> = {};
    filteredNodeTypes.forEach((t) => depths[t.id] = 0);
    
    const relations = filteredNodeTypes.flatMap(type => 
      (type.allowedChildren || []).map(ac => ({
        parentNodeTypeId: type.id,
        childNodeTypeId: ac.childNodeTypeId
      }))
    );

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

    // 2. Group node types by depth
    const typesByDepth: Record<number, NodeType[]> = {};
    filteredNodeTypes.forEach((type) => {
      const depth = depths[type.id];
      if (!typesByDepth[depth]) typesByDepth[depth] = [];
      typesByDepth[depth].push(type);
    });

    const levels = [{ value: "flat", label: "Flat Board", rowTypeIds: [] as string[], cardTypeIds: [] as string[] }];

    // 3. For each depth d -> d+1:
    // If there is any relation between node types at depth d and node types at depth d+1,
    // we create a BoardLevel option.
    const maxDepth = Object.values(depths).length > 0 ? Math.max(...Object.values(depths), 0) : 0;
    for (let d = 0; d < maxDepth; d++) {
      const rowTypes = typesByDepth[d] || [];
      const cardTypes = typesByDepth[d + 1] || [];
      if (rowTypes.length === 0 || cardTypes.length === 0) continue;

      // Check if there is any relation between these two levels
      const hasRelation = relations.some(rel => 
        rowTypes.some(rt => rt.id === rel.parentNodeTypeId) &&
        cardTypes.some(ct => ct.id === rel.childNodeTypeId)
      );

      if (hasRelation) {
        const pluralize = (name: string) => {
          if (name.toLowerCase().endsWith('y')) {
            return name.slice(0, -1) + 'ies';
          }
          return name + 's';
        };
        const rowLabel = rowTypes.map(t => pluralize(t.name)).join(" / ");
        const cardLabel = cardTypes.map(t => pluralize(t.name)).join(" / ");
        
        levels.push({
          value: `depth-${d}`,
          label: `${rowLabel} → ${cardLabel}`,
          rowTypeIds: rowTypes.map(t => t.id),
          cardTypeIds: cardTypes.map(t => t.id)
        });
      }
    }

    return levels;
  }, [filteredNodeTypes]);

  const [boardLevelView, setBoardLevelView] = useState<string>(() => {
    if (availableLevels.length > 1) {
      return availableLevels[availableLevels.length - 1].value;
    }
    return "flat";
  });

  const activeLevelConfig = useMemo(() => {
    return availableLevels.find(l => l.value === boardLevelView) || availableLevels[0];
  }, [availableLevels, boardLevelView]);

  return {
    availableLevels,
    boardLevelView,
    setBoardLevelView,
    activeLevelConfig
  };
}
