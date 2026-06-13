import { useMemo, useCallback } from "react";
import { Node } from "@/lib/types";

export function useGanttLayout(
  nodes: Node[],
  boardLevelView: string | undefined,
  rowTypeIds: string[],
  cardTypeIds: string[]
) {
  const getDescendantNodeIds = useCallback((parentNodeId: string): string[] => {
    const list: string[] = [];
    const traverse = (id: string) => {
      nodes.forEach(n => {
        if (n.parentLinks?.some(pl => pl.parentNode?.id === id)) {
          if (!list.includes(n.id)) {
            list.push(n.id);
            traverse(n.id);
          }
        }
      });
    };
    traverse(parentNodeId);
    return list;
  }, [nodes]);

  const { parentNodes, childNodes, childByParentId, unparentedChildren } = useMemo(() => {
    if (!boardLevelView || boardLevelView === "flat") {
      const sortedNodes = [...nodes].sort((a, b) => {
        const timeA = new Date(a.createdAt || a.id || 0).getTime();
        const timeB = new Date(b.createdAt || b.id || 0).getTime();
        return timeA - timeB;
      });
      return {
        parentNodes: [],
        childNodes: [],
        childByParentId: {} as Record<string, Node[]>,
        unparentedChildren: sortedNodes
      };
    }

    const parents = nodes.filter(n => rowTypeIds.includes(n.nodeTypeId));
    const children = nodes.filter(n => cardTypeIds.includes(n.nodeTypeId));

    const mapping: Record<string, Node[]> = {};
    parents.forEach(p => {
      const parentChildren = children.filter(c => 
        c.parentLinks?.some(pl => pl.parentNode?.id === p.id)
      );
      mapping[p.id] = parentChildren.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.id || 0).getTime();
        const timeB = new Date(b.createdAt || b.id || 0).getTime();
        return timeA - timeB;
      });
    });

    const parentIdsSet = new Set(parents.map(p => p.id));
    const childIdsSet = new Set(children.map(c => c.id));
    const unparented = nodes.filter(n => 
      !parentIdsSet.has(n.id) && 
      (!childIdsSet.has(n.id) || !n.parentLinks?.some(pl => parentIdsSet.has(pl.parentNode?.id)))
    );

    const sortedUnparented = [...unparented].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.id || 0).getTime();
      const timeB = new Date(b.createdAt || b.id || 0).getTime();
      return timeA - timeB;
    });

    return {
      parentNodes: parents,
      childNodes: children,
      childByParentId: mapping,
      unparentedChildren: sortedUnparented
    };
  }, [nodes, boardLevelView, rowTypeIds, cardTypeIds]);

  const layout = useMemo(() => {
    if (!boardLevelView || boardLevelView === "flat" || parentNodes.length === 0) {
      const nodeRows: Record<string, { row: number; isChild: boolean }> = {};
      nodes.forEach((n, idx) => {
        nodeRows[n.id] = { row: idx, isChild: false };
      });
      return {
        globalRowsCount: nodes.length,
        parentBoxes: [],
        nodeLayouts: nodeRows
      };
    }

    const getDates = (node: Node) => {
      const start = new Date(node.startDate || node.createdAt || Date.now());
      const end = node.endDate ? new Date(node.endDate) : new Date(start);
      return { start, end };
    };

    const sortedParents = [...parentNodes].sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeA - timeB;
    });

    const lanes: Node[][] = [];
    sortedParents.forEach(parent => {
      const { start: pStart, end: pEnd } = getDates(parent);
      
      let assignedLaneIndex = -1;
      for (let i = 0; i < lanes.length; i++) {
        const lane = lanes[i];
        const hasOverlap = lane.some(otherParent => {
          const { start: oStart, end: oEnd } = getDates(otherParent);
          return pStart < oEnd && pEnd > oStart;
        });
        if (!hasOverlap) {
          assignedLaneIndex = i;
          break;
        }
      }
      
      if (assignedLaneIndex === -1) {
        lanes.push([parent]);
      } else {
        lanes[assignedLaneIndex].push(parent);
      }
    });

    const parentBoxes: { id: string; parent: Node; startRow: number; rowCount: number }[] = [];
    const nodeLayouts: Record<string, { row: number; isChild: boolean; parentBoxId?: string }> = {};
    let currentGlobalRow = 0;

    lanes.forEach(lane => {
      let maxLaneRows = 1;
      lane.forEach(parent => {
        const children = childByParentId[parent.id] || [];
        maxLaneRows = Math.max(maxLaneRows, 1 + children.length);
      });

      lane.forEach(parent => {
        const children = childByParentId[parent.id] || [];
        
        nodeLayouts[parent.id] = { row: currentGlobalRow, isChild: false };

        children.forEach((child, childIdx) => {
          nodeLayouts[child.id] = {
            row: currentGlobalRow + 1 + childIdx,
            isChild: true,
            parentBoxId: parent.id
          };
        });

        parentBoxes.push({
          id: parent.id,
          parent,
          startRow: currentGlobalRow,
          rowCount: 1 + children.length
        });
      });

      currentGlobalRow += maxLaneRows;
    });

    unparentedChildren.forEach(child => {
      nodeLayouts[child.id] = { row: currentGlobalRow, isChild: true };
      currentGlobalRow++;
    });

    return {
      globalRowsCount: currentGlobalRow,
      parentBoxes,
      nodeLayouts
    };
  }, [boardLevelView, parentNodes, childByParentId, unparentedChildren, nodes]);

  return { getDescendantNodeIds, layout, childByParentId, parentNodes, unparentedChildren };
}
