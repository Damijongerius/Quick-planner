"use client";

import { useState, useEffect } from "react";
import { BoardHeader } from "./BoardHeader";
import { KanbanBoard } from "./KanbanBoard";
import { GanttChart } from "./GanttChart";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";
import { getAllNodes } from "@/lib/actions";
import { getActiveSprint, getFilteredNodes, getSortedNodes, findNodeById } from "@/lib/boardUtils";
import "./Board.css";

export function BoardView({ projectId, initialSprints, initialNodeTypes, initialNodes, initialActiveSprintId }: any) {
  const [viewMode, setViewMode] = useState("KANBAN");
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(initialActiveSprintId || null);
  const [selectedNodeTypeIds, setSelectedNodeTypeIds] = useState<string[]>([]);
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => { setNodes(initialNodes); }, [initialNodes]);

  const activeSprint = getActiveSprint(initialSprints, selectedSprintId);
  const filteredNodes = getFilteredNodes(nodes, viewMode, selectedSprintId, selectedNodeTypeIds);
  const sortedNodes = getSortedNodes(filteredNodes, initialNodeTypes);

  const refresh = async () => setNodes(await getAllNodes(projectId));

  return (
    <div className="flex flex-col w-full">
      <BoardHeader sprints={initialSprints} nodeTypes={initialNodeTypes} selectedSprintId={selectedSprintId} selectedNodeTypeIds={selectedNodeTypeIds} viewMode={viewMode} onSprintChange={setSelectedSprintId} onNodeTypeToggle={(id: string) => id === 'all' ? setSelectedNodeTypeIds([]) : setSelectedNodeTypeIds((prev: any) => prev.includes(id) ? prev.filter((i: any) => i !== id) : [...prev, id])} onViewModeChange={setViewMode} />

      <div className="board-main-layout">
        <div className="board-content-area">
            {viewMode === 'KANBAN' ? (
              <KanbanBoard projectId={projectId} initialSprint={activeSprint} initialNodes={sortedNodes} nodeTypes={initialNodeTypes} onRefresh={refresh} onNodeClick={(id) => { const n = findNodeById(nodes, id); if (n) { setSelectedNode(n); setIsPanelOpen(true); } }} />
            ) : (
              <GanttChart projectId={projectId} nodes={sortedNodes} sprints={initialSprints} currentSprintId={selectedSprintId} />
            )}
        </div>

        <AnimatePresence mode="wait">
          {isPanelOpen && (
            <motion.div 
              key={selectedNode?.id} 
              initial={{ x: '100%', opacity: 0 }} 
              animate={{ x: 0, opacity: 1 }} 
              exit={{ x: '100%', opacity: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 120 }} 
              className="board-side-panel-container"
            >
              <NodeSidePanel 
                projectId={projectId} 
                node={selectedNode} 
                isOpen={isPanelOpen} 
                onClose={() => { setIsPanelOpen(false); refresh(); }} 
                sprints={initialSprints} 
                allNodes={nodes} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
