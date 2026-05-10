"use client";

import { useState, useEffect } from "react";
import { Plus, Archive, ArchiveRestore, Sparkles, FileJson } from "lucide-react";
import { createNode, getNodeChildren, archiveNode } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { AIImportModal } from "./ai/AIImportModal";
import { BacklogNodeRow } from "./BacklogNodeRow";
import { Button } from "./ui/Button";

interface BacklogTreeProps {
  projectId: string;
  node: any;
  nodeTypes: any[];
  onSelect: (node: any) => void;
  selectedNodeId?: string;
  depth?: number;
  hideCompleted?: boolean;
}

export function BacklogTree({ projectId, node, nodeTypes, onSelect, selectedNodeId, depth = 0, hideCompleted = false }: BacklogTreeProps) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [children, setChildren] = useState<any[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const isSelected = selectedNodeId === node.id;
  const nodeType = nodeTypes.find(t => t.id === node.nodeTypeId) || node.type;
  const allowedChildren = nodeType?.allowedChildren?.map((ac: any) => ac.childNodeTypeType) || [];
  const initialChildren = node.childLinks?.map((l: any) => l.childNode) || [];

  useEffect(() => { if (initialChildren.length > 0 && children.length === 0) setChildren(initialChildren); }, [node.id]);

  const loadChildren = async () => {
    setIsLoadingChildren(true);
    try { const data = await getNodeChildren(projectId, node.id); setChildren(data); }
    catch (error) { console.error("Failed to load children", error); }
    finally { setIsLoadingChildren(false); }
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (newOpenState && children.length === 0) loadChildren();
  };

  const progress = (() => {
    const targetNodes = children.length > 0 ? children : initialChildren;
    if (targetNodes.length === 0) return node.status === 'DONE' ? 100 : 0;
    const totalProgress = targetNodes.reduce((acc: number, child: any) => acc + (child.status === 'DONE' ? 100 : (child.status === 'IN_PROGRESS' ? 50 : 0)), 0);
    return Math.round(totalProgress / targetNodes.length);
  })();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;
    await createNode(projectId, node.id, selectedType.id, newNodeTitle);
    setIsCreating(false);
    setNewNodeTitle("");
    setSelectedType(null);
    setIsOpen(true);
    loadChildren();
  };

  if (hideCompleted && node.status === 'DONE') return null;

  return (
    <div className="w-full" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <BacklogNodeRow 
        node={node} nodeType={nodeType} depth={depth} isOpen={isOpen} isSelected={isSelected}
        isLoadingChildren={isLoadingChildren} hasChildren={children.length > 0 || initialChildren.length > 0}
        isHovered={isHovered} onToggle={toggleOpen} onSelect={() => onSelect(node)}
        onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }}
        progress={progress}
      />

      {/* Context Menu */}
      <AnimatePresence>
          {contextMenu && (
              <>
                  <div className="context-menu-overlay" onClick={() => setContextMenu(null)} />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }} 
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                  >
                      <button 
                        onClick={() => { archiveNode(projectId, node.id, !node.isArchived); setContextMenu(null); }} 
                        className="context-menu-item"
                      >
                          {node.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
                          {node.isArchived ? "Restore Node" : "Archive Node"}
                      </button>
                  </motion.div>
              </>
          )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }} 
            className="overflow-hidden"
          >
            {children.map((child: any) => (
              <BacklogTree key={child.id} projectId={projectId} node={child} nodeTypes={nodeTypes} onSelect={onSelect} selectedNodeId={selectedNodeId} depth={depth + 1} hideCompleted={hideCompleted} />
            ))}

            {/* AI Generator Trigger */}
            {allowedChildren.length > 0 && (
                <div 
                    className="backlog-tree-actions" 
                    style={{ 
                        '--depth-padding': `${depth * 40 + 80}px`,
                        backgroundColor: 'transparent',
                        border: 'none'
                    } as any}
                >
                    {!isCreating ? (
                        <div className="flex gap-md">
                            <button 
                                onClick={() => setIsAIModalOpen(true)} 
                                className="button-premium px-lg py-xs text-[10px] rounded-full border-dashed"
                                style={{ padding: '6px 16px' }}
                            >
                                <Sparkles size={12} className="text-primary" />
                                AI Generate
                            </button>
                            <button 
                                onClick={() => setIsCreating(true)} 
                                className="button-secondary px-lg py-xs text-[10px] rounded-full"
                                style={{ padding: '6px 16px' }}
                            >
                                <Plus size={12} />
                                Add Child
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleCreate} className="child-creation-form" style={{ padding: '24px', borderRadius: '24px', boxShadow: 'var(--ambient-shadow)' }}>
                            <div className="text-meta text-[9px] mb-sm opacity-60">SELECT OBJECTIVE TYPE</div>
                            <div className="flex flex-wrap gap-xs mb-lg">
                                {allowedChildren.map((type: any) => (
                                    <button 
                                        key={type.id} 
                                        type="button" 
                                        onClick={() => setSelectedType(type)} 
                                        className={`type-chip ${selectedType?.id === type.id ? 'active' : ''}`}
                                        style={{ '--type-color': type.color } as any}
                                    >
                                        {type.name.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-md">
                                <input 
                                    autoFocus 
                                    className="input-premium flex-1 h-11 text-sm" 
                                    placeholder="Enter strategic title..." 
                                    value={newNodeTitle} 
                                    onChange={(e) => setNewNodeTitle(e.target.value)} 
                                />
                                <button 
                                    type="submit" 
                                    className="button-premium px-xl" 
                                    disabled={!newNodeTitle || !selectedType}
                                >
                                    Initialize
                                </button>
                                <button 
                                    type="button" 
                                    className="button-ghost" 
                                    onClick={() => setIsCreating(false)}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AIImportModal projectId={projectId} isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} mode="SUBTREE" context={{ nodeId: node.id, nodeTypes: allowedChildren, title: node.title }} />
    </div>
  );
}
