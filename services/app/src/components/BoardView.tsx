"use client";

import { useState } from "react";
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

  const activeSprint = getActiveSprint(initialSprints, selectedSprintId);
  const filteredNodes = getFilteredNodes(nodes, viewMode, selectedSprintId, selectedNodeTypeIds);
  const sortedNodes = getSortedNodes(filteredNodes, initialNodeTypes);

  const refresh = async () => setNodes(await getAllNodes(projectId));

  return (
    <div className="flex flex-col w-full">
      <BoardHeader sprints={initialSprints} nodeTypes={initialNodeTypes} selectedSprintId={selectedSprintId} selectedNodeTypeIds={selectedNodeTypeIds} viewMode={viewMode} onSprintChange={setSelectedSprintId} onNodeTypeToggle={(id: string) => id === 'all' ? setSelectedNodeTypeIds([]) : setSelectedNodeTypeIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id])} onViewModeChange={setViewMode} />

      <div className="board-main-layout">
        <div className="board-content-area">
            {viewMode === 'KANBAN' ? (
              <KanbanBoard projectId={projectId} initialSprint={activeSprint} initialNodes={sortedNodes} nodeTypes={initialNodeTypes} onRefresh={refresh} onNodeClick={(id) => { const n = findNodeById(nodes, id); if (n) { setSelectedNode(n); setIsPanelOpen(true); } }} />
            ) : (
              <GanttChart nodes={sortedNodes} sprints={initialSprints} currentSprintId={selectedSprintId} />
            )}
        </div>

        <AnimatePresence mode="wait">
          {isPanelOpen && selectedNode && (
            <motion.div 
              key={selectedNode.id} 
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
                nodeTypes={initialNodeTypes}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
