"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, Clock, Layers } from "lucide-react";
import { IconRenderer } from "../IconPicker";

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

interface KanbanCardProps {
  task: Node;
  onClick: () => void;
  isDragging?: boolean;
}

export function KanbanCard({ task, onClick, isDragging }: KanbanCardProps) {
  const isDone = task.status === 'DONE';
  const isInProgress = task.status === 'IN_PROGRESS';
  const parentNode = task.parentLinks?.[0]?.parentNode;

  return (
    <motion.div 
      whileHover={!isDragging ? { y: -4, boxShadow: 'var(--ambient-shadow)' } : {}}
      onClick={onClick}
      className={`kanban-card ${isDone ? 'done' : ''} ${isDragging ? 'dragging' : ''} ${isInProgress ? 'in-progress' : ''}`}
      style={{ '--node-color': task.type.color } as any}
    >
      <div className="flex justify-between items-start mb-md">
        <div className="flex gap-sm items-center">
            <div className="text-node-color">
                <IconRenderer name={task.type.icon} size={14} />
            </div>
            <span className="kanban-card-type text-node-color">
                {task.type.name}
            </span>
        </div>
        
        <CardAvatar isDone={isDone} />
      </div>

      {parentNode && <ParentLink title={parentNode.title} />}

      <h4 className="kanban-card-title">
        {task.title}
      </h4>

      <CardFooter status={task.status} />
    </motion.div>
  );
}

// --- Implementation Details ---

function CardAvatar({ isDone }: { isDone: boolean }) {
  if (isDone) {
    return (
      <div className="kanban-card-check">
        <Check size={12} strokeWidth={3} />
      </div>
    );
  }
  return (
    <div className="kanban-card-avatar">
      <IconRenderer name="User" size={12} />
    </div>
  );
}

function ParentLink({ title }: { title: string }) {
  return (
    <div className="kanban-card-parent">
      <Layers size={10} />
      <span className="text-xs font-bold">{title}</span>
    </div>
  );
}

function CardFooter({ status }: { status: string }) {
  const statusLabel = status === 'DONE' ? 'Finished' : (status === 'IN_PROGRESS' ? 'Active' : 'Queued');
  
  return (
    <div className="kanban-card-footer">
      <div className="flex items-center gap-xs">
        <Clock size={14} />
        <span>{statusLabel}</span>
      </div>
    </div>
  );
}
