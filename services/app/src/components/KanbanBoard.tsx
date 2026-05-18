"use client";

import { useState } from "react";
import { DragDropContext, DropResult, DraggableLocation } from "@hello-pangea/dnd";
import { updateNodeStatus } from "@/lib/actions";
import { useProject } from "./ProjectContext";
import { Node, Sprint, NodeType } from "@/lib/types";


import { KanbanColumn } from "./kanban/KanbanColumn";

export function KanbanBoard({ 
    projectId, 
    initialSprint, 
    initialNodes, 
    onRefresh, 
    onNodeClick 
}: Readonly<{ 
    projectId: string, 
    initialSprint: Sprint | null, 
    initialNodes: Node[], 
    nodeTypes: NodeType[],
    onRefresh: () => void, 
    onNodeClick: (id: string) => void 
}>) {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [prevInitialNodes, setPrevInitialNodes] = useState(initialNodes);
  const { isReadOnly } = useProject();

  if (initialNodes !== prevInitialNodes) {
    setPrevInitialNodes(initialNodes);
    setNodes(initialNodes);
  }

  if (!initialSprint) {
    return <NoActiveSprintState />;
  }

  return (
    <DragDropContext onDragEnd={(result) => !isReadOnly && handleDragEnd(result, { projectId, nodes, setNodes, initialNodes, onRefresh })}>
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
    </DragDropContext>
  );
}

// --- Implementation Details (The Prose) ---

interface DragEndParams {
  projectId: string;
  nodes: Node[];
  setNodes: (nodes: Node[]) => void;
  initialNodes: Node[];
  onRefresh: () => void;
}

async function handleDragEnd(result: DropResult, params: DragEndParams) {
  const { projectId, nodes, setNodes, initialNodes, onRefresh } = params;
  const { destination, source, draggableId } = result;

  if (isInvalidDrop(destination, source)) return;

  // Optimistic Update
  updateLocalNodeStatus(nodes, setNodes, draggableId, destination!.droppableId);

  // Persistence
  try {
      await updateNodeStatus(projectId, draggableId, destination!.droppableId);
      onRefresh();
  } catch {
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

function updateLocalNodeStatus(nodes: Node[], setNodes: (nodes: Node[]) => void, nodeId: string, newStatus: string) {
  const updatedNodes = [...nodes];
  const nodeIndex = updatedNodes.findIndex((n) => n.id === nodeId);
  if (nodeIndex !== -1) {
      updatedNodes[nodeIndex] = { ...updatedNodes[nodeIndex], status: newStatus };
      setNodes(updatedNodes);
  }
}
