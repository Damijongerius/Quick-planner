"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Search, Archive, ArchiveRestore } from "lucide-react";
import { createNode, getRootNodes } from "@/lib/actions";
import { BacklogTree } from "./BacklogTree";
import { NodeSidePanel } from "./NodeSidePanel";
import { AnimatePresence, motion } from "framer-motion";

interface BacklogViewProps {
  rootNodes: any[];
  nodeTypes: any[];
  sprints: any[];
  allNodes: any[];
}

export function BacklogView({ rootNodes: initialNodes, nodeTypes, sprints, allNodes }: BacklogViewProps) {
  const [nodes, setNodes] = useState(initialNodes);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Sync with initialNodes if they change from server
  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  // Re-fetch when showArchived changes
  useEffect(() => {
    const refresh = async () => {
      const data = await getRootNodes(showArchived);
      setNodes(data);
    };
    refresh();
  }, [showArchived]);

  // Handle updates to selectedNode when the underlying node in the list changes
  useEffect(() => {
    if (selectedNode) {
      // Find the latest version of the selected node in the full tree
      const findNode = (items: any[]): any => {
        for (const item of items) {
          if (item.id === selectedNode.id) return item;
          if (item.childLinks) {
            const found = findNode(item.childLinks.map((l: any) => l.childNode));
            if (found) return found;
          }
        }
        return null;
      };
      const latest = findNode(nodes);
      if (latest) setSelectedNode(latest);
    }
  }, [nodes]);

  const handleSelectNode = (node: any) => {
    setSelectedNode(node);
    setIsPanelOpen(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Search & Actions Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input 
            className="input-premium"
            style={{ paddingLeft: '40px' }}
            placeholder="Search backlog..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
        </div>
        
        <button 
          onClick={() => setShowArchived(!showArchived)}
          className="button-premium"
          style={{ 
            padding: '0 12px', 
            height: '42px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            backgroundColor: showArchived ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            borderColor: showArchived ? '#3b82f6' : 'rgba(255,255,255,0.05)'
          }}
          title={showArchived ? "Hide Archived" : "Show Archived"}
        >
          {showArchived ? <ArchiveRestore size={18} /> : <Archive size={18} />}
          <span style={{ fontSize: '0.8rem' }}>{showArchived ? 'Archived' : 'Active'}</span>
        </button>

        <div style={{ display: 'flex', gap: '12px' }}>
          {nodeTypes.map(type => (
            <button 
              key={type.id}
              onClick={async () => {
                const title = prompt(`Enter title for new ${type.name}:`);
                if (title) await createNode(null, type.id, title);
              }}
              className="button-premium"
              style={{ height: '42px', padding: '0 16px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px', borderColor: `${type.color}40`, color: type.color }}
            >
              <PlusCircle size={16} /> New {type.name}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flex: 1, minHeight: 0 }}>
        {/* Tree View Area */}
        <div className="glass" style={{ 
          flex: isPanelOpen ? 1.5 : 1, 
          overflowY: 'auto', 
          padding: '24px', 
          backgroundColor: 'rgba(255,255,255,0.01)',
          transition: 'flex 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {nodes.map(node => (
            <BacklogTree 
              key={node.id} 
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
              <p style={{ fontSize: '0.875rem' }}>
                {showArchived ? "Archived items will appear here." : "Start by creating a root node from the buttons above."}
              </p>
            </div>
          )}
        </div>

        {/* Editor Area (Split Pane) */}
        <AnimatePresence mode="wait">
          {isPanelOpen && (
            <motion.div 
              key={selectedNode?.id}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '500px', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 120 }}
              style={{ 
                overflow: 'hidden',
                display: 'flex',
                maxHeight: '100%'
              }}
            >
              <NodeSidePanel 
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
