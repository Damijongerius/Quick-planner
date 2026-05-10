"use client";

import { useState, useEffect } from "react";
import { BoardHeader } from "./BoardHeader";
import { KanbanBoard } from "./KanbanBoard";
import { GanttChart } from "./GanttChart";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";
import { getAllNodes } from "@/lib/actions";

interface BoardViewProps {
  projectId: string;
  initialSprints: any[];
  initialNodeTypes: any[];
  initialNodes: any[];
  initialActiveSprintId?: string;
}

export function BoardView({
  projectId,
  initialSprints,
  initialNodeTypes,
  initialNodes,
  initialActiveSprintId
}: BoardViewProps) {
  const [viewMode, setViewMode] = useState("KANBAN");
  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(initialActiveSprintId || null);
  const [selectedNodeTypeIds, setSelectedNodeTypeIds] = useState<string[]>([]);
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // The Story: High-level intentions
  const activeSprint = getActiveSprint(initialSprints, selectedSprintId);
  const filteredNodes = getFilteredNodes(nodes, viewMode, selectedSprintId, selectedNodeTypeIds);
  const sortedNodes = getSortedNodes(filteredNodes, initialNodeTypes);

  return (
    <div className="flex flex-col w-full">
      <BoardHeader 
        sprints={initialSprints}
        nodeTypes={initialNodeTypes}
        selectedSprintId={selectedSprintId}
        selectedNodeTypeIds={selectedNodeTypeIds}
        viewMode={viewMode}
        onSprintChange={setSelectedSprintId}
        onNodeTypeToggle={(id) => handleNodeTypeToggle(id, setSelectedNodeTypeIds)}
        onViewModeChange={setViewMode}
      />

      <div className="board-main-layout">
        <div className="board-content-area">
            {viewMode === 'KANBAN' && (
              <KanbanBoard 
                projectId={projectId}
                initialSprint={activeSprint}
                initialNodes={sortedNodes}
                nodeTypes={initialNodeTypes}
                onRefresh={() => handleDataRefresh(projectId, setNodes)} 
                onNodeClick={(id) => handleNodeSelection(id, nodes, setSelectedNode, setIsPanelOpen)} 
              />
            )}
            {viewMode === 'GANTT' && (
              <GanttChart 
                projectId={projectId}
                nodes={sortedNodes}
                sprints={initialSprints}
                currentSprintId={selectedSprintId}
              />
            )}
        </div>

        <AnimatePresence mode="wait">
          {isPanelOpen && (
            <motion.div 
              key={selectedNode?.id}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '450px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              className="board-side-panel-container"
            >
              <NodeSidePanel 
                projectId={projectId}
                node={selectedNode} 
                isOpen={isPanelOpen} 
                onClose={() => handlePanelClose(setIsPanelOpen, () => handleDataRefresh(projectId, setNodes))} 
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

// --- Implementation Details (The Prose) ---

async function handleDataRefresh(projectId: string, setNodes: Function) {
  const updatedNodes = await getAllNodes(projectId);
  setNodes(updatedNodes);
}

function handleNodeSelection(nodeId: string, nodes: any[], setSelectedNode: Function, setIsPanelOpen: Function) {
  const node = findNodeById(nodes, nodeId);
  if (node) {
    setSelectedNode(node);
    setIsPanelOpen(true);
  }
}

function handleNodeTypeToggle(id: string, setSelectedNodeTypeIds: Function) {
  if (id === 'all') {
    setSelectedNodeTypeIds([]);
    return;
  }
  setSelectedNodeTypeIds((prev: string[]) => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
}

function handlePanelClose(setIsPanelOpen: Function, refreshCallback: Function) {
  setIsPanelOpen(false);
  refreshCallback();
}

function getActiveSprint(sprints: any[], selectedSprintId: string | null) {
  return sprints.find(s => s.id === selectedSprintId) || sprints[0];
}

function getFilteredNodes(nodes: any[], viewMode: string, selectedSprintId: string | null, selectedNodeTypeIds: string[]) {
  return nodes.filter(node => {
    const boardConfig = node.type?.boardConfig;
    if (boardConfig?.preferredView) {
        if (viewMode === 'KANBAN' && boardConfig.preferredView === 'GANTT') return false;
        if (viewMode === 'GANTT' && boardConfig.preferredView === 'KANBAN') return false;
    }

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

function getSortedNodes(nodes: any[], nodeTypes: any[]) {
  return [...nodes].sort((a, b) => {
    const indexA = nodeTypes.findIndex(t => t.id === a.nodeTypeId);
    const indexB = nodeTypes.findIndex(t => t.id === b.nodeTypeId);
    return indexA - indexB;
  });
}

function findNodeById(nodes: any[], id: string) {
  return nodes.find(n => n.id === id);
}
