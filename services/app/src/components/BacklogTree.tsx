"use client";

import { useState, useEffect, useRef } from "react";
import { Draggable, Droppable } from "@hello-pangea/dnd";
import { getNodeChildren, getNode } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

import { BacklogNodeRow } from "./BacklogNodeRow";
import { BacklogChildCreation } from "./BacklogChildCreation";
import { useReorderRegistry } from "./backlog/ReorderContext";
import { byRank } from "@/lib/order";
import { Node, NodeType, Sprint } from "@/lib/types";

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
  /** Position among its siblings (needed by the drag-and-drop list). */
  index: number;
  selection?: ReadonlySet<string>;
  onToggleSelect?: (id: string) => void;
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
  syncStamp,
  index,
  selection,
  onToggleSelect
}: Readonly<BacklogTreeProps>) {
  const nodeType = nodeTypes.find((t) => t.id === node.nodeTypeId) || node.type;
  const allowedChildren = nodeType?.allowedChildren?.map((ac) => ac.childNodeTypeType) || [];
  const initialChildren = (node.childLinks?.map((l) => l.childNode) || [])
    .filter((c) => c.isArchived === showArchived)
    .sort(byRank);

  const [isOpen, setIsOpen] = useState(depth < 1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [children, setChildren] = useState<Node[]>(initialChildren);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [prevNodeId, setPrevNodeId] = useState(node.id);
  const [prevChildLinks, setPrevChildLinks] = useState(node.childLinks);

  if (node.id !== prevNodeId) {
    setPrevNodeId(node.id);
    setChildren(initialChildren);
  } else if (node.childLinks !== prevChildLinks) {
    setPrevChildLinks(node.childLinks);
    setChildren(initialChildren);
  }

  const prevSyncStamp = useRef(syncStamp);
  useEffect(() => {
    if (syncStamp !== prevSyncStamp.current) {
      prevSyncStamp.current = syncStamp;
      if (isOpen && depth > 0) {
        loadChildren();
      }
    }
  }, [syncStamp, isOpen, depth]);

  const progress = calculateNodeProgress(node.status, children, initialChildren);

  // Completed children can be hidden; the drag list must only contain what is actually shown.
  const visibleChildren = children.filter((c) => !(hideCompleted && c.status === "DONE"));
  const registry = useReorderRegistry();
  const visibleRef = useRef(visibleChildren);
  useEffect(() => { visibleRef.current = visibleChildren; });
  useEffect(() => registry?.register(`children:${node.id}`, {
    ids: () => visibleRef.current.map((c) => c.id),
    apply: (ids) => setChildren((prev) => {
      const byId = new Map(prev.map((c) => [c.id, c]));
      const ordered = ids.map((id) => byId.get(id)).filter((c): c is Node => !!c);
      const rest = prev.filter((c) => !ids.includes(c.id));
      return [...ordered, ...rest];
    }),
  }), [registry, node.id]);

  if (hideCompleted && node.status === 'DONE') {
    return null;
  }

  return (
    <Draggable draggableId={node.id} index={index} isDragDisabled={isReadOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`w-full ${snapshot.isDragging ? "rounded-md bg-panel shadow-lg ring-1 ring-accent/40" : ""}`}
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
            onSelect={handleSelect}
            onAddChild={allowedChildren.length > 0 && !isReadOnly ? handleAddChild : undefined}
            progress={progress} 
            isHovered={isHovered} 
            selectedColumns={selectedColumns}
            sprints={sprints}
            selectedNodeType={selectedNodeType}
            isReadOnly={isReadOnly}
            onNodeUpdated={handleLocalNodeUpdate}
            dragHandleProps={isReadOnly ? null : provided.dragHandleProps}
            checked={selection?.has(node.id) ?? false}
            anySelected={(selection?.size ?? 0) > 0}
            onToggleChecked={onToggleSelect ? () => onToggleSelect(node.id) : undefined}
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
                <Droppable droppableId={`children:${node.id}`} type={`list:${node.id}`}>
                  {(dropProvided) => (
                    <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
                      {visibleChildren.map((child: Node, i: number) => (
                        <BacklogTree 
                          key={child.id} 
                          index={i}
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
                          selection={selection}
                          onToggleSelect={onToggleSelect}
                        />
                      ))}
                      {dropProvided.placeholder}
                    </div>
                  )}
                </Droppable>
                {(allowedChildren.length > 0 && !isReadOnly && (selectedNodeId === node.id || isAddingChild)) && (
                  <BacklogChildCreation 
                    key={isAddingChild ? "adding" : "idle"}
                    startOpen={isAddingChild}
                    onClose={() => setIsAddingChild(false)}
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
      )}
    </Draggable>
  );

  // ==========================================
  // INNER HELPER FUNCTIONS (Hoisted)
  // ==========================================

  async function handleLocalNodeUpdate() {
    await loadChildren();
    if (onNodeUpdated) {
      onNodeUpdated();
    }
  }

  async function loadChildren() {
    setIsLoadingChildren(true);
    try {
      const rawChildren = await getNodeChildren(projectId, node.id);
      const filtered = rawChildren.filter(c => c.isArchived === showArchived);
      const sorted = [...filtered].sort(byRank);
      setChildren(sorted);
    }
    catch (error) { console.error("Failed to load child nodes", error); }
    finally { setIsLoadingChildren(false); }
  }

  // Selecting a node that can have children opens it, so its "Add child item" row is always reachable
  // (previously a childless story stayed collapsed, with no way to add tasks to it).
  function handleSelect() {
    onSelect(node);
    if (allowedChildren.length > 0 && !isOpen) {
      setIsOpen(true);
      if (children.length === 0) loadChildren();
    }
  }

  function handleAddChild() {
    onSelect(node);
    setIsOpen(true);
    setIsAddingChild(true);
    if (children.length === 0) loadChildren();
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
    } else if (c.status === 'REVIEW') {
      nodeProgress = 75;
    } else if (c.status === 'IN_PROGRESS') {
      nodeProgress = 50;
    }
    return acc + nodeProgress;
  }, 0);

  return Math.round(totalProgress / target.length);
}
