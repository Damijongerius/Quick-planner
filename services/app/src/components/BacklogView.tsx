"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createNode, getRootNodes } from "@/lib/actions";
import { BacklogTree } from "./BacklogTree";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";
import { AIImportModal } from "./ai/AIImportModal";
import { BacklogToolbar } from "./BacklogToolbar";

interface BacklogViewProps {
  projectId: string;
  rootNodes: any[];
  nodeTypes: any[];
  sprints: any[];
  allNodes: any[];
}

export function BacklogView({ projectId, rootNodes: initialNodes, nodeTypes, sprints, allNodes }: BacklogViewProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const searchParams = useSearchParams();

  const childTypeIds = new Set(nodeTypes.flatMap(t => t.allowedChildren?.map((ac: any) => ac.childNodeTypeId) || []));
  const availableRootTypes = nodeTypes.filter(t => !childTypeIds.has(t.id)).length > 0 
    ? nodeTypes.filter(t => !childTypeIds.has(t.id)) 
    : nodeTypes;

  useEffect(() => {
    const nodeId = searchParams.get('nodeId');
    if (nodeId && allNodes.length > 0) {
      const node = allNodes.find(n => n.id === nodeId);
      if (node) { setSelectedNode(node); setIsPanelOpen(true); }
    }
  }, [searchParams, allNodes]);

  useEffect(() => { setNodes(initialNodes); }, [initialNodes]);

  useEffect(() => {
    const refresh = async () => { const data = await getRootNodes(projectId, showArchived); setNodes(data); };
    refresh();
  }, [showArchived, projectId]);

  const handleCreateRoot = async (typeId: string, typeName: string) => {
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
        onOpenAIBuilder={() => setIsAIModalOpen(true)}
      />

      <AIImportModal 
        projectId={projectId} isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)}
        context={{ nodes: allNodes.slice(0, 50), allNodeTypes: nodeTypes, allSprints: sprints }} 
      />

      <div className="backlog-main-layout">
        <div className="backlog-tree-container card-sanctuary">
          {nodes.map(node => (
            <BacklogTree key={node.id} projectId={projectId} node={node} nodeTypes={nodeTypes} onSelect={(n) => { setSelectedNode(n); setIsPanelOpen(true); }} selectedNodeId={selectedNode?.id} hideCompleted={hideCompleted} />
          ))}

          {nodes.length === 0 && (
            <div className="backlog-empty-state">
              <h3 className="text-xl mb-sm">{showArchived ? "No archived items found." : "Your backlog is empty."}</h3>
              <p className="text-secondary text-sm">Start by initializing a strategic pillar above.</p>
            </div>
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
