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

interface ColumnProps {
  id: string;
  title: string;
  tasks: Node[];
  color: string;
  onNodeClick: (id: string) => void;
}

function KanbanColumn({ id, title, tasks, color, onNodeClick }: ColumnProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minWidth: '280px' }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '0 8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }}></div>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '0.1em', 
            color: 'var(--on-surface-variant)' 
          }}>
            {title}
          </h3>
          <span style={{ 
            backgroundColor: 'var(--surface-container-highest)', 
            padding: '2px 8px', 
            borderRadius: '4px', 
            fontSize: '10px', 
            fontWeight: 700, 
            color: 'var(--on-surface-variant)' 
          }}>
            {tasks.length}
          </span>
        </div>
      </header>

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '16px',
              minHeight: '500px',
              transition: 'background-color 0.2s',
              backgroundColor: snapshot.isDraggingOver ? 'rgba(0,0,0,0.02)' : 'transparent',
              borderRadius: '16px',
              padding: '4px'
            }}
          >
            {tasks.map((task, index) => (
              <Draggable key={task.id} draggableId={task.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.8 : 1,
                    }}
                  >
                    <KanbanCard 
                      task={task} 
                      onClick={() => onNodeClick(task.id)}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.2 }}>
                <p style={{ fontSize: '0.75rem' }}>No tasks in this column</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}

function KanbanCard({ task, onClick, isDragging }: { task: Node, onClick: () => void, isDragging?: boolean }) {
  const isDone = task.status === 'DONE';
  const isInProgress = task.status === 'IN_PROGRESS';
  const parentNode = task.parentLinks?.[0]?.parentNode;

  return (
    <motion.div 
      whileHover={!isDragging ? { y: -4, boxShadow: 'var(--ambient-shadow)' } : {}}
      onClick={onClick}
      style={{ 
        padding: '20px 24px', 
        cursor: 'pointer', 
        backgroundColor: isDone ? 'rgba(234, 239, 242, 0.5)' : 'var(--surface-container-lowest)',
        borderRadius: '16px',
        border: isDragging ? '2px solid var(--primary)' : '1px solid transparent',
        transition: 'background-color 0.2s, box-shadow 0.2s',
        boxShadow: isDragging ? 'var(--primary-shadow)' : (isDone ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'),
        opacity: isDone ? 0.8 : 1,
        borderLeft: !isDragging && isInProgress ? `4px solid ${task.type.color}` : '1px solid transparent',
        position: 'relative'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div style={{ color: task.type.color }}>
                <IconRenderer name={task.type.icon} size={14} />
            </div>
            <span style={{ 
                fontSize: '9px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: task.type.color
            }}>
                {task.type.name}
            </span>
        </div>
        
        {isDone ? (
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Check size={12} strokeWidth={3} />
            </div>
        ) : (
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconRenderer name="User" size={12} />
            </div>
        )}
      </div>

      {parentNode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', opacity: 0.6 }}>
            <Layers size={10} />
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--on-surface-variant)' }}>{parentNode.title}</span>
          </div>
      )}

      <h4 style={{ 
        fontSize: '14px', 
        fontWeight: 700, 
        lineHeight: 1.4, 
        color: isDone ? 'var(--on-surface-variant)' : 'var(--on-surface)',
        textDecoration: isDone ? 'line-through' : 'none',
        marginBottom: '12px'
      }}>
        {task.title}
      </h4>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'rgba(89, 96, 100, 0.6)', fontSize: '11px', fontWeight: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={14} />
              <span>{isDone ? 'Finished' : (isInProgress ? 'Active' : 'Queued')}</span>
          </div>
      </div>
    </motion.div>
  );
}

export function KanbanBoard({ 
    projectId, 
    initialSprint, 
    initialNodes, 
    nodeTypes,
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

  // Sync state when props change
  useEffect(() => {
      setNodes(initialNodes);
  }, [initialNodes]);

  if (!initialSprint) {
    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
        <Calendar size={48} style={{ marginBottom: '24px' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Active Sprint</h3>
        <p style={{ fontSize: '0.875rem' }}>Select or create a strategic cycle in Workspace Settings.</p>
      </div>
    );
  }

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // Optimistic UI update
    const updatedNodes = Array.from(nodes);
    const nodeIndex = updatedNodes.findIndex(n => n.id === draggableId);
    if (nodeIndex !== -1) {
        updatedNodes[nodeIndex].status = destination.droppableId;
        setNodes(updatedNodes);
    }

    // Persist to database
    try {
        await updateNodeStatus(projectId, draggableId, destination.droppableId);
        onRefresh(); // Trigger parent refresh to sync status propagation etc
    } catch (error) {
        console.error("Failed to update status", error);
        setNodes(initialNodes); // Revert on error
    }
  };

  const displayColumns = [
      { id: 'TODO', title: 'To Do', color: 'var(--on-surface-variant)' },
      { id: 'IN_PROGRESS', title: 'In Progress', color: 'var(--primary)' },
      { id: 'REVIEW', title: 'Review', color: 'var(--error)' },
      { id: 'DONE', title: 'Done', color: 'var(--tertiary)' }
  ];

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '32px', alignItems: 'start' }}>
          {displayColumns.map((col) => (
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
