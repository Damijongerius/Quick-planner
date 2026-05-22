"use client";

import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";

import { Node } from "@/lib/types";

interface ColumnProps {
  id: string;
  title: string;
  tasks: Node[];
  color: string;
  onNodeClick: (id: string) => void;
  isReadOnly?: boolean;
  hideHeader?: boolean;
}

function DraggableTask({ task, index, onNodeClick, isReadOnly }: Readonly<{ task: Node; index: number; onNodeClick: (id: string) => void; isReadOnly?: boolean }>) {
  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isReadOnly}>
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
  );
}

export function KanbanColumn({ id, title, tasks, color, onNodeClick, isReadOnly, hideHeader = false }: Readonly<ColumnProps>) {
  return (
    <div className="kanban-column">
      {!hideHeader && (
        <header className="kanban-column-header">
          <div className="flex items-center gap-md">
            <div className="status-dot" style={{ '--dot-color': color } as React.CSSProperties}></div>
            <h3 className="kanban-column-title">{title}</h3>
            <span className="kanban-column-count">{tasks.length}</span>
          </div>
        </header>
      )}

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div 
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`kanban-drop-zone ${snapshot.isDraggingOver ? 'dragging-over' : ''} ${hideHeader ? 'swimlane-drop-zone' : ''}`}
          >
            {tasks.map((task, index) => (
              <DraggableTask 
                key={task.id} 
                task={task} 
                index={index} 
                onNodeClick={onNodeClick} 
                isReadOnly={isReadOnly} 
              />
            ))}
            {provided.placeholder}
            <EmptyState isVisible={tasks.length === 0 && !snapshot.isDraggingOver} />
          </div>
        )}
      </Droppable>
    </div>
  );
}

// --- Implementation Details ---

function EmptyState({ isVisible }: Readonly<{ isVisible: boolean }>) {
  if (!isVisible) return null;
  return (
    <div className="kanban-empty-state">
      <p className="text-xs">No tasks in this column</p>
    </div>
  );
}
