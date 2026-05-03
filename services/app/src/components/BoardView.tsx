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
  
  // Local state for nodes to support dragging and panel updates
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  useEffect(() => {
      setNodes(initialNodes);
  }, [initialNodes]);

  const refreshData = async () => {
      const updatedNodes = await getAllNodes(projectId);
      setNodes(updatedNodes);
  };

  const handleNodeClick = (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
          setSelectedNode(node);
          setIsPanelOpen(true);
      }
  };

  const activeSprint = initialSprints.find(s => s.id === selectedSprintId) || initialSprints[0];

  // Filter nodes for the current board
  const filteredNodes = nodes.filter(node => {
    // 1. Check Visibility based on Node Governance (BoardConfig)
    const boardConfig = node.type?.boardConfig;
    if (boardConfig?.preferredView) {
        if (viewMode === 'KANBAN' && boardConfig.preferredView === 'GANTT') return false;
        if (viewMode === 'GANTT' && boardConfig.preferredView === 'KANBAN') return false;
    }

    // 2. Sprint filtering
    const isSprintEligible = node.type?.isSprintEligible;
    const nodeSprintId = node.sprintId;
    const parentSprintId = node.parentLinks?.[0]?.parentNode?.sprintId;
    
    // In GANTT mode, we show everything that isn't sprint-eligible (Strategic Pillars) 
    // PLUS items that match the current sprint.
    const matchesSprint = !selectedSprintId || 
                          nodeSprintId === selectedSprintId || 
                          parentSprintId === selectedSprintId ||
                          (viewMode === 'GANTT' && !isSprintEligible);

    // 3. Multi-type filtering
    const matchesType = selectedNodeTypeIds.length === 0 || selectedNodeTypeIds.includes(node.nodeTypeId);
    
    return matchesSprint && matchesType && !node.isArchived;
  });

  // Sort nodes based on the order of Node Types in Governance/RelationMap
  const sortedNodes = [...filteredNodes].sort((a, b) => {
    const indexA = initialNodeTypes.findIndex(t => t.id === a.nodeTypeId);
    const indexB = initialNodeTypes.findIndex(t => t.id === b.nodeTypeId);
    return indexA - indexB;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <BoardHeader 
        sprints={initialSprints}
        nodeTypes={initialNodeTypes}
        selectedSprintId={selectedSprintId}
        selectedNodeTypeIds={selectedNodeTypeIds}
        viewMode={viewMode}
        onSprintChange={setSelectedSprintId}
        onNodeTypeToggle={(id) => {
            if (id === 'all') {
                setSelectedNodeTypeIds([]);
                return;
            }
            setSelectedNodeTypeIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
        }}
        onViewModeChange={setViewMode}
      />

      <div style={{ display: 'flex', gap: '24px', width: '100%' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
            {viewMode === 'KANBAN' && (
              <KanbanBoard 
                projectId={projectId}
                initialSprint={activeSprint}
                initialNodes={sortedNodes}
                nodeTypes={initialNodeTypes}
                onRefresh={refreshData} 
                onNodeClick={handleNodeClick} 
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

        {/* Side Panel Integration */}
        <AnimatePresence mode="wait">
          {isPanelOpen && (
            <motion.div 
              key={selectedNode?.id}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '450px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              style={{ overflow: 'hidden', flexShrink: 0, position: 'sticky', top: '100px', height: 'calc(100vh - 140px)' }}
            >
              <NodeSidePanel 
                projectId={projectId}
                node={selectedNode} 
                isOpen={isPanelOpen} 
                onClose={() => {
                    setIsPanelOpen(false);
                    refreshData(); // Refresh board after panel closed to get any changes
                }} 
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
