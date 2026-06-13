"use client";

import { motion, AnimatePresence } from "framer-motion";
import { BacklogNodeRow } from "./BacklogNodeRow";
import { BacklogChildCreation } from "./BacklogChildCreation";
import { Node, NodeType, Sprint } from "@/lib/types";
import { useBacklogTreeNode } from "./useBacklogTreeNode";
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
  showArchived?: boolean;
  onNodeUpdated?: () => void;
  syncStamp?: number;
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
  selectedNodeType,
  showArchived = false,
  onNodeUpdated,
  syncStamp
}: Readonly<BacklogTreeProps>) {
  const nodeType = nodeTypes.find((t) => t.id === node.nodeTypeId) || node.type;
  const allowedChildren = nodeType?.allowedChildren?.map((ac) => ac.childNodeTypeType) || [];

  const {
    isOpen,
    isTransitioning, setIsTransitioning,
    children,
    isLoadingChildren,
    isHovered, setIsHovered,
    progress,
    initialChildren,
    handleLocalNodeUpdate,
    loadChildren,
    handleToggle
  } = useBacklogTreeNode(node, projectId, showArchived, depth, syncStamp, onNodeUpdated);

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
        projectId={projectId}
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
        isReadOnly={isReadOnly}
        onNodeUpdated={handleLocalNodeUpdate}
      />

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: 'auto' }} 
            exit={{ opacity: 0, height: 0 }}
            onAnimationStart={() => setIsTransitioning(true)}
            onAnimationComplete={() => setIsTransitioning(false)}
            style={{ overflow: isTransitioning ? 'hidden' : 'visible' }}
          >
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
                showArchived={showArchived}
                onNodeUpdated={handleLocalNodeUpdate}
                syncStamp={syncStamp}
              />
            ))}
            {(allowedChildren.length > 0 && !isReadOnly && selectedNodeId === node.id) && (
              <BacklogChildCreation 
                projectId={projectId} 
                node={node} 
                allowedChildren={allowedChildren} 
                depth={depth} 
                onChildCreated={async (newNode) => {
                  await loadChildren();
                  onSelect(newNode);
                }} 
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
