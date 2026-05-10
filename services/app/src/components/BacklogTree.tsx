"use client";

import { useState, useEffect } from "react";
import { getNodeChildren } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { AIImportModal } from "./ai/AIImportModal";
import { BacklogNodeRow } from "./BacklogNodeRow";
import { BacklogContextMenu } from "./BacklogContextMenu";
import { BacklogChildCreation } from "./BacklogChildCreation";
import "./Backlog.css";

export function BacklogTree({ projectId, node, nodeTypes, onSelect, selectedNodeId, depth = 0, hideCompleted = false }: any) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const [children, setChildren] = useState<any[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const nodeType = nodeTypes.find((t: any) => t.id === node.nodeTypeId) || node.type;
  const allowedChildren = nodeType?.allowedChildren?.map((ac: any) => ac.childNodeTypeType) || [];
  const initialChildren = node.childLinks?.map((l: any) => l.childNode) || [];

  useEffect(() => { if (initialChildren.length > 0 && children.length === 0) setChildren(initialChildren); }, [node.id]);

  const loadChildren = async () => {
    setIsLoadingChildren(true);
    try { setChildren(await getNodeChildren(projectId, node.id)); }
    finally { setIsLoadingChildren(false); }
  };

  const progress = (() => {
    const target = children.length > 0 ? children : initialChildren;
    if (target.length === 0) return node.status === 'DONE' ? 100 : 0;
    return Math.round(target.reduce((acc: number, c: any) => acc + (c.status === 'DONE' ? 100 : (c.status === 'IN_PROGRESS' ? 50 : 0)), 0) / target.length);
  })();

  if (hideCompleted && node.status === 'DONE') return null;

  return (
    <div className="w-full" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <BacklogNodeRow node={node} nodeType={nodeType} depth={depth} isOpen={isOpen} isSelected={selectedNodeId === node.id} isLoadingChildren={isLoadingChildren} hasChildren={children.length > 0 || initialChildren.length > 0} onToggle={(e) => { e.stopPropagation(); setIsOpen(!isOpen); if (!isOpen && children.length === 0) loadChildren(); }} onSelect={() => onSelect(node)} onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); }} progress={progress} isHovered={isHovered} />
      
      <BacklogContextMenu projectId={projectId} node={node} contextMenu={contextMenu} onClose={() => setContextMenu(null)} />

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {children.map((child: any) => (
              <BacklogTree key={child.id} projectId={projectId} node={child} nodeTypes={nodeTypes} onSelect={onSelect} selectedNodeId={selectedNodeId} depth={depth + 1} hideCompleted={hideCompleted} />
            ))}
            {allowedChildren.length > 0 && <BacklogChildCreation projectId={projectId} node={node} allowedChildren={allowedChildren} depth={depth} onChildCreated={loadChildren} onOpenAI={() => setIsAIModalOpen(true)} />}
          </motion.div>
        )}
      </AnimatePresence>
      <AIImportModal projectId={projectId} isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} mode="SUBTREE" context={{ nodeId: node.id, nodeTypes: allowedChildren, title: node.title }} />
    </div>
  );
}
