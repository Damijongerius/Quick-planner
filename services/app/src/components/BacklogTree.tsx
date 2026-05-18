"use client";

import { useState } from "react";
import { getNodeChildren } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

import { BacklogNodeRow } from "./BacklogNodeRow";
import { BacklogContextMenu } from "./BacklogContextMenu";
import { BacklogChildCreation } from "./BacklogChildCreation";
import { Node, NodeType } from "@/lib/types";
import "./Backlog.css";

interface BacklogTreeProps {
  projectId: string;
  node: Node;
  nodeTypes: NodeType[];
  onSelect: (node: Node) => void;
  selectedNodeId: string | null;
  depth?: number;
  hideCompleted?: boolean;
  isReadOnly?: boolean;
}

export function BacklogTree({ 
  projectId, 
  node, 
  nodeTypes, 
  onSelect, 
  selectedNodeId, 
  depth = 0, 
  hideCompleted = false, 
  isReadOnly = false 
}: Readonly<BacklogTreeProps>) {
  const nodeType = nodeTypes.find((t) => t.id === node.nodeTypeId) || node.type;
  const allowedChildren = nodeType?.allowedChildren?.map((ac) => ac.childNodeTypeType) || [];
  const initialChildren = node.childLinks?.map((l) => l.childNode) || [];

  const [isOpen, setIsOpen] = useState(depth < 1);
  const [children, setChildren] = useState<Node[]>(initialChildren);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [prevNodeId, setPrevNodeId] = useState(node.id);

  if (node.id !== prevNodeId) {
    setPrevNodeId(node.id);
    setChildren(initialChildren);
  }

  const loadChildren = async () => {
    setIsLoadingChildren(true);
    try { setChildren(await getNodeChildren(projectId, node.id)); }
    finally { setIsLoadingChildren(false); }
  };

  const progress = (() => {
    const target = children.length > 0 ? children : initialChildren;
    if (target.length === 0) {
      return node.status === 'DONE' ? 100 : 0;
    }
    
    const totalProgress = target.reduce((acc: number, c: Node) => {
      let nodeProgress = 0;
      if (c.status === 'DONE') {
        nodeProgress = 100;
      } else if (c.status === 'IN_PROGRESS') {
        nodeProgress = 50;
      }
      return acc + nodeProgress;
    }, 0);

    return Math.round(totalProgress / target.length);
  })();

  if (hideCompleted && node.status === 'DONE') {
    return null;
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      if (children.length === 0) {
        loadChildren();
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isReadOnly) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <div 
      className="w-full" 
      role="group"
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <BacklogNodeRow 
        node={node} 
        nodeType={nodeType} 
        depth={depth} 
        isOpen={isOpen} 
        isSelected={selectedNodeId === node.id} 
        isLoadingChildren={isLoadingChildren} 
        hasChildren={children.length > 0 || initialChildren.length > 0} 
        onToggle={handleToggle} 
        onSelect={() => onSelect(node)} 
        onContextMenu={handleContextMenu} 
        progress={progress} 
        isHovered={isHovered} 
      />
      
      {isReadOnly ? null : <BacklogContextMenu projectId={projectId} node={node} contextMenu={contextMenu} onClose={() => setContextMenu(null)} />}

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {children.map((child: Node) => (
              <BacklogTree key={child.id} projectId={projectId} node={child} nodeTypes={nodeTypes} onSelect={onSelect} selectedNodeId={selectedNodeId} depth={depth + 1} hideCompleted={hideCompleted} isReadOnly={isReadOnly} />
            ))}
            {(allowedChildren.length > 0 && !isReadOnly) && <BacklogChildCreation projectId={projectId} node={node} allowedChildren={allowedChildren} depth={depth} onChildCreated={loadChildren} />}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
