"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  AlertCircle, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  Clock, 
  Play, 
  CheckCircle2, 
  MoreHorizontal,
  FileText,
  Check,
  Layers
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { updateNodeStatus } from "@/lib/actions";
import { IconRenderer } from "./IconPicker";

interface Node {
  id: string;
  title: string;
  status: string;
  content: any;
  nodeTypeId: string;
  type: {
    id: string;
    name: string;
    color: string;
    icon: string;
    boardConfig?: any;
    fields: any[];
  };
  blockedBy?: { blockingNode: any }[];
  parentLinks?: { parentNode: { title: string } }[];
}

import { KanbanColumn } from "./kanban/KanbanColumn";

export function KanbanBoard({ 
    projectId, 
    initialSprint, 
    initialNodes, 
    onRefresh, 
    onNodeClick 
}: { 
    projectId: string, 
    initialSprint: any, 
    initialNodes: any[], 
    nodeTypes: any[],
    onRefresh: () => void, 
    onNodeClick: (id: string) => void 
}) {
  const [nodes, setNodes] = useState(initialNodes);

  useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes]);

  if (!initialSprint) {
    return <NoActiveSprintState />;
  }

  return (
    <DragDropContext onDragEnd={(result) => handleDragEnd(result, { projectId, nodes, setNodes, initialNodes, onRefresh })}>
        <div className="kanban-grid">
          {getKanbanColumns().map((col) => (
            <KanbanColumn 
              key={col.id} 
              id={col.id} 
              title={col.title} 
              color={col.color} 
              onNodeClick={onNodeClick}
              tasks={nodes.filter((t: any) => t.status === col.id)} 
            />
          ))}
        </div>
    </DragDropContext>
  );
}

// --- Implementation Details (The Prose) ---

async function handleDragEnd(result: DropResult, params: any) {
  const { projectId, nodes, setNodes, initialNodes, onRefresh } = params;
  const { destination, source, draggableId } = result;

  if (isInvalidDrop(destination, source)) return;

  // Optimistic Update
  updateLocalNodeStatus(nodes, setNodes, draggableId, destination!.droppableId);

  // Persistence
  try {
      await updateNodeStatus(projectId, draggableId, destination!.droppableId);
      onRefresh();
  } catch (error) {
      setNodes(initialNodes);
  }
}

function NoActiveSprintState() {
  return (
    <div className="kanban-no-sprint">
      <Calendar size={48} className="mb-xl" />
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

function isInvalidDrop(destination: any, source: any) {
  if (!destination) return true;
  if (destination.droppableId === source.droppableId && destination.index === source.index) return true;
  return false;
}

function updateLocalNodeStatus(nodes: any[], setNodes: Function, nodeId: string, newStatus: string) {
  const updatedNodes = [...nodes];
  const nodeIndex = updatedNodes.findIndex(n => n.id === nodeId);
  if (nodeIndex !== -1) {
      updatedNodes[nodeIndex].status = newStatus;
      setNodes(updatedNodes);
  }
}
