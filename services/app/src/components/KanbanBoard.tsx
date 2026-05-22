"use client";

import { useState } from "react";
import { DragDropContext, DropResult, DraggableLocation } from "@hello-pangea/dnd";
import { updateNodeStatus } from "@/lib/actions";
import { useProject } from "./ProjectContext";
import { Node, Sprint, NodeType } from "@/lib/types";
import { IconRenderer } from "./IconPicker";

import { KanbanColumn } from "./kanban/KanbanColumn";

export function KanbanBoard({ 
    projectId, 
    initialSprint, 
    initialNodes, 
    allNodes,
    nodeTypes,
    boardLevelView = "flat",
    rowTypeIds = [],
    cardTypeIds = [],
    onRefresh, 
    onNodeClick 
}: Readonly<{ 
    projectId: string, 
    initialSprint: Sprint | null, 
    initialNodes: Node[], 
    allNodes: Node[],
    nodeTypes: NodeType[],
    boardLevelView?: string,
    rowTypeIds?: string[],
    cardTypeIds?: string[],
    onRefresh: () => void, 
    onNodeClick: (id: string) => void 
}>) {
  const isLayered = boardLevelView !== "flat";
  const rowTypeIdsSet = new Set(rowTypeIds);
  const cardTypeIdsSet = new Set(cardTypeIds);

  // Filter cards: active, sprint-matching, and matching card types
  const cards = isLayered 
    ? initialNodes.filter(n => cardTypeIdsSet.has(n.nodeTypeId))
    : initialNodes;

  // Filter rows: active, parent of active cards OR directly in sprint, and matching row types
  const parentNodeIds = new Set(cards.map(node => node.parentLinks?.[0]?.parentNode?.id).filter(Boolean));
  const rows = isLayered
    ? allNodes.filter(node => 
        !node.isArchived &&
        rowTypeIdsSet.has(node.nodeTypeId) &&
        (node.sprintId === initialSprint?.id || parentNodeIds.has(node.id))
      )
    : [];

  const [nodes, setNodes] = useState<Node[]>(cards);
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);
  const { isReadOnly } = useProject();

  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(cards);
  }

  if (!initialSprint) {
    return <NoActiveSprintState />;
  }

  return (
    <DragDropContext onDragEnd={(result) => !isReadOnly && handleDragEnd(result, { 
      projectId, 
      nodes, 
      setNodes, 
      initialNodes: cards, 
      allNodes,
      isLayered,
      onRefresh 
    })}>
        {isLayered ? (
          <div className="flex flex-col gap-lg w-full">
            {/* Top Column Headers */}
            <div className="kanban-grid mb-xs">
              {getKanbanColumns().map((col) => {
                const totalCount = nodes.filter((t) => t.status === col.id).length;
                return (
                  <div key={col.id} className="flex items-center gap-md px-md py-sm">
                    <div className="status-dot" style={{ '--dot-color': col.color } as React.CSSProperties}></div>
                    <h3 className="kanban-column-title">{col.title}</h3>
                    <span className="kanban-column-count">{totalCount}</span>
                  </div>
                );
              })}
            </div>

            {/* Swimlanes */}
            {rows.map((rowNode) => (
              <div key={rowNode.id} className="w-full">
                <div 
                  onClick={() => onNodeClick(rowNode.id)}
                  className="flex items-center justify-between p-md bg-container-low rounded-xl border border-outline-variant hover:border-primary cursor-pointer transition-all mt-md mb-md"
                >
                  <div className="flex items-center gap-md">
                    <div className="text-node-color animate-pulse-subtle" style={{ '--node-color': rowNode.type.color || 'var(--primary)' } as React.CSSProperties}>
                      <IconRenderer name={rowNode.type.icon || 'Target'} size={16} />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider opacity-60" style={{ color: rowNode.type.color || undefined }}>
                      {rowNode.type.name}
                    </span>
                    <span className="board-header-divider"></span>
                    <h3 className="text-sm font-bold text-on-surface">{rowNode.title}</h3>
                  </div>
                  <div className="flex items-center gap-md">
                    <span className="text-xs font-semibold text-on-surface-variant bg-surface-container-high px-sm py-xs rounded-full">
                      {rowNode.status}
                    </span>
                  </div>
                </div>

                <div className="kanban-grid">
                  {getKanbanColumns().map((col) => (
                    <KanbanColumn 
                      key={`${col.id}:${rowNode.id}`} 
                      id={`${col.id}:${rowNode.id}`} 
                      title={col.title} 
                      color={col.color} 
                      onNodeClick={onNodeClick}
                      tasks={nodes.filter((t) => t.status === col.id && t.parentLinks?.[0]?.parentNode?.id === rowNode.id)} 
                      isReadOnly={isReadOnly}
                      hideHeader
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Unparented Swimlane */}
            <div className="w-full">
              <div className="flex items-center justify-between p-md bg-container-low rounded-xl border border-dashed border-outline-variant mt-xl mb-md">
                <div className="flex items-center gap-md">
                  <div className="text-on-surface-variant opacity-60">
                    <IconRenderer name="HelpCircle" size={16} />
                  </div>
                  <h3 className="text-sm font-bold text-on-surface opacity-60">Unparented Items</h3>
                </div>
              </div>

              <div className="kanban-grid">
                {getKanbanColumns().map((col) => (
                  <KanbanColumn 
                    key={`${col.id}:unparented`} 
                    id={`${col.id}:unparented`} 
                    title={col.title} 
                    color={col.color} 
                    onNodeClick={onNodeClick}
                    tasks={nodes.filter((t) => t.status === col.id && (!t.parentLinks || t.parentLinks.length === 0 || !rows.some(r => r.id === t.parentLinks?.[0]?.parentNode?.id)))} 
                    isReadOnly={isReadOnly}
                    hideHeader
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="kanban-grid">
            {getKanbanColumns().map((col) => (
              <KanbanColumn 
                key={col.id} 
                id={col.id} 
                title={col.title} 
                color={col.color} 
                onNodeClick={onNodeClick}
                tasks={nodes.filter((t) => t.status === col.id)} 
                isReadOnly={isReadOnly}
              />
            ))}
          </div>
        )}
    </DragDropContext>
  );
}

// --- Implementation Details (The Prose) ---

interface DragEndParams {
  projectId: string;
  nodes: Node[];
  setNodes: (nodes: Node[]) => void;
  initialNodes: Node[];
  allNodes: Node[];
  isLayered: boolean;
  onRefresh: () => void;
}

async function handleDragEnd(result: DropResult, params: DragEndParams) {
  const { projectId, nodes, setNodes, initialNodes, allNodes, isLayered, onRefresh } = params;
  const { destination, source, draggableId } = result;

  if (isInvalidDrop(destination, source)) return;

  let destStatus = destination!.droppableId;
  let destParentId: string | null = null;
  let sourceStatus = source.droppableId;
  let sourceParentId: string | null = null;

  if (isLayered) {
    const [dStatus, dParent] = destination!.droppableId.split(':');
    destStatus = dStatus;
    destParentId = dParent === 'unparented' ? null : dParent;

    const [sStatus, sParent] = source.droppableId.split(':');
    sourceStatus = sStatus;
    sourceParentId = sParent === 'unparented' ? null : sParent;
  }

  // Optimistic local state update
  const updatedNodes = [...nodes];
  const nodeIndex = updatedNodes.findIndex((n) => n.id === draggableId);
  if (nodeIndex !== -1) {
    const oldNode = updatedNodes[nodeIndex];
    let newParentLinks = oldNode.parentLinks || [];
    if (isLayered && destParentId !== sourceParentId) {
      if (destParentId) {
        const parentNode = allNodes.find(n => n.id === destParentId);
        if (parentNode) {
          newParentLinks = [{
            id: 'temp-link-id',
            parentNode
          }];
        }
      } else {
        newParentLinks = [];
      }
    }
    updatedNodes[nodeIndex] = { 
      ...oldNode, 
      status: destStatus,
      parentLinks: newParentLinks
    };
    setNodes(updatedNodes);
  }

  // Persistence updates
  try {
    const promises = [];
    if (destStatus !== sourceStatus) {
      promises.push(updateNodeStatus(projectId, draggableId, destStatus));
    }
    if (isLayered && destParentId !== sourceParentId) {
      const { updateNodeParent } = await import("@/lib/actions");
      promises.push(updateNodeParent(projectId, draggableId, destParentId));
    }
    await Promise.all(promises);
    onRefresh();
  } catch (error) {
    console.error("Drag persistence failed", error);
    setNodes(initialNodes);
  }
}

function NoActiveSprintState() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h3 className="text-xl mb-sm">No Active Sprint</h3>
      <p className="text-sm">Select or create a strategic cycle in Workspace Settings.</p>
    </div>
  );
}

function getKanbanColumns() {
  return [
    { id: 'TODO', title: 'To Do', color: 'var(--on-surface-variant)' },
    { id: 'IN_PROGRESS', title: 'In Progress', color: 'var(--primary)' },
    { id: 'REVIEW', title: 'Review', color: 'var(--error)' },
    { id: 'DONE', title: 'Done', color: 'var(--tertiary)' }
  ];
}

function isInvalidDrop(destination: DraggableLocation | null | undefined, source: DraggableLocation) {
  if (!destination) return true;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return true;
  return false;
}
