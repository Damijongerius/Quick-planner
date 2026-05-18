"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createNode, getRootNodes } from "@/lib/actions";
import { BacklogTree } from "./BacklogTree";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";

import { BacklogToolbar } from "./BacklogToolbar";
import { useProject } from "./ProjectContext";

import { Node, NodeType, Sprint } from "@/lib/types";

interface BacklogViewProps {
  readonly projectId: string;
  readonly rootNodes: Node[];
  readonly nodeTypes: NodeType[];
  readonly sprints: Sprint[];
  readonly allNodes: Node[];
}

export function BacklogView({ projectId, rootNodes: initialNodes, nodeTypes, sprints, allNodes }: BacklogViewProps) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);

  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(initialNodes);
  }

  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(true);
  const searchParams = useSearchParams();
  const { isReadOnly } = useProject();

  const childTypeIds = new Set(nodeTypes.flatMap((t) => t.allowedChildren?.map((ac) => ac.childNodeTypeId) || []));
  const availableRootTypes = nodeTypes.some((t) => !childTypeIds.has(t.id))
    ? nodeTypes.filter((t) => !childTypeIds.has(t.id)) 
    : nodeTypes;

  const urlNodeId = searchParams.get('nodeId');
  const [prevUrlNodeId, setPrevUrlNodeId] = useState<string | null>(null);

  if (urlNodeId !== prevUrlNodeId) {
    setPrevUrlNodeId(urlNodeId);
    if (urlNodeId && allNodes.length > 0) {
      const node = allNodes.find((n) => n.id === urlNodeId);
      if (node) {
        setSelectedNode(node);
        setIsPanelOpen(true);
      }
    }
  }

  useEffect(() => {
    const refresh = async () => { const data = await getRootNodes(projectId, showArchived); setNodes(data); };
    refresh();
  }, [showArchived, projectId]);

  const handleCreateRoot = async (typeId: string, typeName: string) => {
    if (isReadOnly) return;
    await createNode(projectId, null, typeId, `New ${typeName}`);
    const data = await getRootNodes(projectId, showArchived);
    setNodes(data);
  };

  return (
    <div className="flex flex-col gap-xl">
      <BacklogToolbar 
        availableRootTypes={availableRootTypes}
        onAddRoot={handleCreateRoot}
        hideCompleted={hideCompleted}
        onToggleHideCompleted={() => setHideCompleted(!hideCompleted)}
        showArchived={showArchived}
        onToggleShowArchived={() => setShowArchived(!showArchived)}
        isReadOnly={isReadOnly}
      />



      <div className="backlog-main-layout">
        <div className="backlog-tree-container card-planner">
          {nodes.map(node => (
            <BacklogTree key={node.id} projectId={projectId} node={node} nodeTypes={nodeTypes} onSelect={(n) => { setSelectedNode(n); setIsPanelOpen(true); }} selectedNodeId={selectedNode?.id || null} hideCompleted={hideCompleted} isReadOnly={isReadOnly} />
          ))}

          {nodes.length === 0 && (
            <div className="backlog-empty-state">
              <h3 className="text-xl mb-sm">{showArchived ? "No archived items found." : "Your backlog is empty."}</h3>
              <p className="text-secondary text-sm">Start by initializing a strategic pillar above.</p>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {isPanelOpen && selectedNode && (
            <motion.div 
                key={selectedNode.id} 
                initial={{ width: 0, opacity: 0 }} 
                animate={{ width: '450px', opacity: 1 }} 
                exit={{ width: 0, opacity: 0 }} 
                transition={{ type: 'spring', damping: 25, stiffness: 120 }} 
                className="backlog-panel-wrapper"
            >
              <NodeSidePanel projectId={projectId} node={selectedNode} isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} sprints={sprints} allNodes={allNodes} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
