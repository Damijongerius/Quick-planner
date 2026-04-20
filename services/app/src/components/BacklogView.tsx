"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Archive, ArchiveRestore, Download, Plus } from "lucide-react";
import { createNode, getRootNodes } from "@/lib/actions";
import { BacklogTree } from "./BacklogTree";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";

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

  // Sync with initialNodes if they change from server
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Re-fetch when showArchived changes
  useEffect(() => {
    const refresh = async () => {
      const data = await getRootNodes(projectId, showArchived);
      setNodes(data);
    };
    refresh();
  }, [showArchived, projectId]);

  const handleSelectNode = (node: any) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  };

  const handleCreateRoot = async () => {
    const firstType = nodeTypes[0];
    if (firstType) {
        await createNode(projectId, null, firstType.id, `New ${firstType.name}`);
        // The page will revalidate via server action, but local update for speed is handled by re-fetching
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          onClick={handleCreateRoot}
          className="button-premium"
          style={{ padding: '12px 24px', fontSize: '13px' }}
        >
          <Plus size={18} />
          <span>Initialize Strategic Pillar</span>
        </button>
      </div>

      <div style={{ display: 'flex', gap: '24px', minHeight: 0 }}>
        {/* Tree View Area */}
        <div className="card-sanctuary" style={{ 
          flex: 1, 
          padding: 0,
          overflow: 'hidden',
          backgroundColor: 'var(--surface-container-lowest)',
          border: '1px solid var(--outline-variant)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
          {nodes.map(node => (
            <BacklogTree 
              key={node.id} 
              projectId={projectId}
              node={node} 
              nodeTypes={nodeTypes} 
              onSelect={handleSelectNode}
              selectedNodeId={selectedNode?.id}
            />
          ))}

          {nodes.length === 0 && (
            <div style={{ padding: '80px', textAlign: 'center', opacity: 0.5 }}>
              <p style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
                {showArchived ? "No archived items found." : "Your backlog is empty."}
              </p>
              <p style={{ fontSize: '0.875rem' }}>Start by initializing a strategic pillar above.</p>
            </div>
          )}
        </div>

        {/* Editor Area (Side Panel) */}
        <AnimatePresence mode="wait">
          {isPanelOpen && (
            <motion.div 
              key={selectedNode?.id}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '450px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              style={{ overflow: 'hidden' }}
            >
              <NodeSidePanel 
                projectId={projectId}
                node={selectedNode} 
                isOpen={isPanelOpen} 
                onClose={() => setIsPanelOpen(false)} 
                sprints={sprints}
                allNodes={allNodes}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
