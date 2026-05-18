"use client";

import { useState } from "react";
import { getNodeChildren } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

import { BacklogNodeRow } from "./BacklogNodeRow";
import { BacklogChildCreation } from "./BacklogChildCreation";
import { Node, NodeType, Sprint } from "@/lib/types";
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
  selectedColumns?: string[];
  sprints?: Sprint[];
  selectedNodeType?: NodeType | null;
}

export function BacklogTree({ 
  projectId, 
  node, 
  nodeTypes, 
  onSelect, 
  selectedNodeId, 
  depth = 0, 
  hideCompleted = false, 
  isReadOnly = false,
  selectedColumns,
  sprints,
  selectedNodeType
}: Readonly<BacklogTreeProps>) {
  const nodeType = nodeTypes.find((t) => t.id === node.nodeTypeId) || node.type;
  const allowedChildren = nodeType?.allowedChildren?.map((ac) => ac.childNodeTypeType) || [];
  const initialChildren = (node.childLinks?.map((l) => l.childNode) || [])
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const [isOpen, setIsOpen] = useState(depth < 1);
  const [children, setChildren] = useState<Node[]>(initialChildren);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [prevNodeId, setPrevNodeId] = useState(node.id);

  if (node.id !== prevNodeId) {
    setPrevNodeId(node.id);
    setChildren(initialChildren);
  }

  const progress = calculateNodeProgress(node.status, children, initialChildren);

  if (hideCompleted && node.status === 'DONE') {
    return null;
  }

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
        progress={progress} 
        isHovered={isHovered} 
        selectedColumns={selectedColumns}
        sprints={sprints}
        selectedNodeType={selectedNodeType}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            {children.map((child: Node) => (
              <BacklogTree 
                key={child.id} 
                projectId={projectId} 
                node={child} 
                nodeTypes={nodeTypes} 
                onSelect={onSelect} 
                selectedNodeId={selectedNodeId} 
                depth={depth + 1} 
                hideCompleted={hideCompleted} 
                isReadOnly={isReadOnly} 
                selectedColumns={selectedColumns}
                sprints={sprints}
                selectedNodeType={selectedNodeType}
              />
            ))}
            {(allowedChildren.length > 0 && !isReadOnly && selectedNodeId === node.id) && (
              <BacklogChildCreation projectId={projectId} node={node} allowedChildren={allowedChildren} depth={depth} onChildCreated={loadChildren} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );

  // ==========================================
  // INNER HELPER FUNCTIONS (Hoisted)
  // ==========================================

  async function loadChildren() {
    setIsLoadingChildren(true);
    try { setChildren(await getNodeChildren(projectId, node.id)); }
    finally { setIsLoadingChildren(false); }
  }

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    if (isOpen) {
      setIsOpen(false);
    } else {
      setIsOpen(true);
      if (children.length === 0) {
        loadChildren();
      }
    }
  }
}

// ==========================================
// PURE HELPER FUNCTIONS (Code as Prose)
// ==========================================

function calculateNodeProgress(status: string, children: Node[], initialChildren: Node[]): number {
  const target = children.length > 0 ? children : initialChildren;
  if (target.length === 0) {
    return status === 'DONE' ? 100 : 0;
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
}
