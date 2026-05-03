"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  const [hideCompleted, setHideCompleted] = useState(true);
  const [showInitMenu, setShowInitMenu] = useState(false);
  const searchParams = useSearchParams();

  const childTypeIds = new Set(nodeTypes.flatMap(t => t.allowedChildren?.map((ac: any) => ac.childNodeTypeId) || []));
  const rootTypes = nodeTypes.filter(t => !childTypeIds.has(t.id));
  
  // If no specific root types found (circular or none defined), allow all
  const availableRootTypes = rootTypes.length > 0 ? rootTypes : nodeTypes;

  // Handle deep linking from AI or other sources
  useEffect(() => {
    const nodeId = searchParams.get('nodeId');
    if (nodeId && allNodes.length > 0) {
      const node = allNodes.find(n => n.id === nodeId);
      if (node) {
        setSelectedNode(node);
        setIsPanelOpen(true);
      }
    }
  }, [searchParams, allNodes]);

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

  const handleCreateRoot = async (typeId: string, typeName: string) => {
    await createNode(projectId, null, typeId, `New ${typeName}`);
    setShowInitMenu(false);
    // The page will revalidate via server action, but local update for speed is handled by re-fetching
    const data = await getRootNodes(projectId, showArchived);
    setNodes(data);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <button 
            onClick={() => availableRootTypes.length > 1 ? setShowInitMenu(!showInitMenu) : handleCreateRoot(availableRootTypes[0]?.id, availableRootTypes[0]?.name)}
            className="button-premium"
            style={{ padding: '12px 24px', fontSize: '13px', gap: '12px' }}
          >
            <Plus size={18} />
            <span>{availableRootTypes.length === 1 ? `Initialize ${availableRootTypes[0]?.name}` : 'Initialize Objective'}</span>
          </button>

          <AnimatePresence>
            {showInitMenu && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="glass"
                style={{ 
                  position: 'absolute', 
                  top: '100%', 
                  left: 0, 
                  marginTop: '12px', 
                  zIndex: 100, 
                  width: '240px',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ padding: '8px 12px', fontSize: '10px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.05em' }}>SELECT ROOT TYPE</div>
                {availableRootTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleCreateRoot(type.id, type.name)}
                    className="button-secondary"
                    style={{ 
                      justifyContent: 'flex-start', 
                      border: 'none', 
                      padding: '10px 12px', 
                      fontSize: '13px',
                      color: type.color
                    }}
                  >
                    <PlusCircle size={14} />
                    {type.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button 
            onClick={() => setHideCompleted(!hideCompleted)}
            className="button-secondary"
            style={{ 
                padding: '8px 16px', 
                fontSize: '11px', 
                fontWeight: 700, 
                backgroundColor: hideCompleted ? 'rgba(0, 107, 96, 0.05)' : 'transparent',
                borderColor: hideCompleted ? 'var(--tertiary)' : 'var(--outline-variant)',
                color: hideCompleted ? 'var(--tertiary)' : 'var(--on-surface-variant)'
            }}
          >
            {hideCompleted ? "SHOW COMPLETED" : "HIDE COMPLETED"}
          </button>
          
          <button 
            onClick={() => setShowArchived(!showArchived)}
            className="button-secondary"
            style={{ 
                padding: '8px 16px', 
                fontSize: '11px', 
                fontWeight: 700,
                backgroundColor: showArchived ? 'rgba(44, 52, 55, 0.05)' : 'transparent',
                borderColor: showArchived ? 'var(--primary)' : 'var(--outline-variant)',
                color: showArchived ? 'var(--primary)' : 'var(--on-surface-variant)'
            }}
          >
            {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            <span>{showArchived ? "BACK TO ACTIVE" : "VIEW ARCHIVE"}</span>
          </button>
        </div>
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
              hideCompleted={hideCompleted}
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
