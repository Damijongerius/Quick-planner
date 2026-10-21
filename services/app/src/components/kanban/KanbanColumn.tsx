"use client";

import React from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { KanbanCard } from "./KanbanCard";
import { QuickAdd, type QuickAddType } from "./QuickAdd";

import { Node } from "@/lib/types";

interface ColumnProps {
  id: string;
  title: string;
  tasks: Node[];
  color: string;
  onNodeClick: (id: string) => void;
  isReadOnly?: boolean;
  hideHeader?: boolean;
  quickAdd?: { types: QuickAddType[]; onAdd: (title: string, typeId: string) => Promise<void> };
}

function DraggableTask({ task, index, onNodeClick, isReadOnly }: Readonly<{ task: Node; index: number; onNodeClick: (id: string) => void; isReadOnly?: boolean }>) {
  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isReadOnly}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={provided.draggableProps.style}
          aria-label={`${task.title}. Press Enter to open, Space to move.`}
          onKeyDown={(e) => { if (e.key === "Enter" && !snapshot.isDragging) { e.preventDefault(); onNodeClick(task.id); } }}
        >
          <KanbanCard task={task} onClick={() => onNodeClick(task.id)} isDragging={snapshot.isDragging} />
        </div>
      )}
    </Draggable>
  );
}

export function KanbanColumn({ id, title, tasks, color, onNodeClick, isReadOnly, hideHeader = false, quickAdd }: Readonly<ColumnProps>) {
  return (
    <div className="flex min-w-0 flex-col gap-2">
      {!hideHeader && (
        <header className="flex items-center gap-2 px-1">
          <span className="h-2 w-2 rounded-full" style={{ background: color }} aria-hidden />
          <h3 className="text-sm font-medium">{title}</h3>
          <span className="text-xs text-faint">{tasks.length}</span>
        </header>
      )}

      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={[
              "flex flex-col gap-2 rounded-lg p-1.5 transition-colors",
              hideHeader ? "min-h-[72px]" : "min-h-[240px]",
              snapshot.isDraggingOver ? "bg-accent-soft outline outline-1 -outline-offset-1 outline-accent/40" : "bg-hover/60",
            ].join(" ")}
          >
            {tasks.map((task, index) => (
              <DraggableTask key={task.id} task={task} index={index} onNodeClick={onNodeClick} isReadOnly={isReadOnly} />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="px-2 py-4 text-center text-xs text-faint">No items</p>
            )}
          </div>
        )}
      </Droppable>
      {quickAdd && !isReadOnly && <QuickAdd types={quickAdd.types} onAdd={quickAdd.onAdd} />}
    </div>
  );
}
