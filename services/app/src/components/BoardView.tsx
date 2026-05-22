"use client";

import { useState, useMemo } from "react";
import { BoardHeader } from "./BoardHeader";
import { KanbanBoard } from "./KanbanBoard";
import { GanttChart } from "./GanttChart";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";
import { getAllNodes } from "@/lib/actions";
import { getActiveSprint, getFilteredNodes, getSortedNodes, findNodeById } from "@/lib/boardUtils";
import "./Board.css";

import { Node, NodeType, Sprint } from "@/lib/types";

interface BoardViewProps {
  readonly projectId: string;
  readonly initialSprints: Sprint[];
  readonly initialNodeTypes: NodeType[];
  readonly initialNodes: Node[];
  readonly initialActiveSprintId?: string | null;
}

export function BoardView({ projectId, initialSprints, initialNodeTypes, initialNodes, initialActiveSprintId }: BoardViewProps) {
  const [viewMode, setViewMode] = useState("KANBAN");
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(initialActiveSprintId || null);
  const [selectedNodeTypeIds, setSelectedNodeTypeIds] = useState<string[]>([]);
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);

  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(initialNodes);
  }

  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const filteredNodeTypes = useMemo(() => {
    return initialNodeTypes.filter(t => {
      const show = t.boardConfig ? (viewMode === 'KANBAN' ? t.boardConfig.showOnKanban : t.boardConfig.showOnGantt) : true;
      return show !== false;
    });
  }, [initialNodeTypes, viewMode]);

  const viableSprints = useMemo(() => {
    return initialSprints.filter(s => s.status !== 'COMPLETED' || s.id === selectedSprintId);
  }, [initialSprints, selectedSprintId]);

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

  const activeLevel = activeLevelConfig.value;

  const activeSprint = getActiveSprint(initialSprints, selectedSprintId);
  const filteredNodes = getFilteredNodes(nodes, viewMode, selectedSprintId, selectedNodeTypeIds);
  const sortedNodes = getSortedNodes(filteredNodes, initialNodeTypes);

  const refresh = async () => setNodes(await getAllNodes(projectId));

  return (
    <div className="flex flex-col w-full">
      <BoardHeader 
        sprints={viableSprints} 
        nodeTypes={filteredNodeTypes} 
        selectedSprintId={selectedSprintId} 
        selectedNodeTypeIds={selectedNodeTypeIds} 
        viewMode={viewMode} 
        onSprintChange={setSelectedSprintId} 
        onNodeTypeToggle={(id: string) => id === 'all' ? setSelectedNodeTypeIds([]) : setSelectedNodeTypeIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])} 
        onViewModeChange={setViewMode}
        boardLevelView={activeLevel}
        onBoardLevelViewChange={setBoardLevelView}
        availableLevels={availableLevels}
      />

      <div className="board-main-layout">
        <div className="board-content-area">
            {viewMode === 'KANBAN' ? (
              <KanbanBoard 
                projectId={projectId} 
                initialSprint={activeSprint} 
                initialNodes={sortedNodes} 
                allNodes={nodes}
                nodeTypes={filteredNodeTypes} 
                boardLevelView={activeLevel}
                rowTypeIds={activeLevelConfig.rowTypeIds}
                cardTypeIds={activeLevelConfig.cardTypeIds}
                onRefresh={refresh} 
                onNodeClick={(id) => { const n = findNodeById(nodes, id); if (n) { setSelectedNode(n); setIsPanelOpen(true); } }} 
              />
            ) : (
              <GanttChart 
                projectId={projectId}
                nodes={sortedNodes} 
                sprints={viableSprints} 
                currentSprintId={selectedSprintId} 
                boardLevelView={activeLevel}
                rowTypeIds={activeLevelConfig.rowTypeIds}
                cardTypeIds={activeLevelConfig.cardTypeIds}
              />
            )}
        </div>

        <AnimatePresence mode="wait">
          {isPanelOpen && selectedNode && (
            <motion.div 
              key={selectedNode.id} 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }} 
              transition={{ type: 'spring', stiffness: 380, damping: 35 }} 
              className="board-side-panel-container"
            >
              <NodeSidePanel 
                projectId={projectId} 
                node={selectedNode} 
                isOpen={isPanelOpen} 
                onClose={() => { setIsPanelOpen(false); refresh(); }} 
                sprints={initialSprints} 
                allNodes={nodes} 
                nodeTypes={initialNodeTypes}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
