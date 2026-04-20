"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Calendar, ChevronRight, ChevronLeft, Clock, Play, CheckCircle2 } from "lucide-react";
import { updateNodeStatus } from "@/lib/actions";
import { IconRenderer } from "./IconPicker";

interface Node {
  id: string;
  title: string;
  status: string;
  content: any;
  type: {
    id: string;
    name: string;
    color: string;
    icon: string;
    boardConfig?: any;
    fields: any[];
  };
  blockedBy?: { blockingNode: any }[];
}

interface ColumnProps {
  id: string;
  title: string;
  tasks: Node[];
  color: string;
  icon: any;
  onMove: (nodeId: string, direction: 'prev' | 'next') => void;
  canMovePrev: boolean;
  canMoveNext: boolean;
  onNodeClick: (id: string) => void;
}

function KanbanColumn({ id, title, tasks, color, icon: Icon, onMove, canMovePrev, canMoveNext, onNodeClick }: ColumnProps) {
  return (
    <div className="glass" style={{ 
      flex: 1, 
      minWidth: '320px', 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      backgroundColor: 'rgba(255,255,255,0.01)',
      border: '1px solid rgba(255,255,255,0.03)',
      borderRadius: '16px',
      overflow: 'hidden'
    }}>
      <header style={{ 
        padding: '24px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `2px solid ${color}`,
        backgroundColor: 'rgba(255,255,255,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${color}15` }}>
            <Icon size={18} color={color} />
          </div>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 10px', borderRadius: '12px' }}>
          {tasks.length}
        </span>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {tasks.map((task) => (
          <KanbanCard 
            key={task.id} 
            task={task} 
            onMove={onMove}
            canMovePrev={canMovePrev}
            canMoveNext={canMoveNext}
            onClick={() => onNodeClick(task.id)}
          />
        ))}
        {tasks.length === 0 && (
          <div style={{ padding: '60px 20px', textAlign: 'center', opacity: 0.2 }}>
            <p style={{ fontSize: '0.75rem' }}>No tasks in this column</p>
          </div>
        )}
      </div>
    </div>
  );
}

function KanbanCard({ task, onMove, canMovePrev, canMoveNext, onClick }: { task: Node, onMove: (id: string, dir: 'prev' | 'next') => void, canMovePrev: boolean, canMoveNext: boolean, onClick: () => void }) {
  const [isMoving, setIsMoving] = useState(false);
  const isBlocked = (task.blockedBy?.length || 0) > 0;

  const handleMove = async (e: React.MouseEvent, dir: 'prev' | 'next') => {
    e.stopPropagation();
    setIsMoving(true);
    await onMove(task.id, dir);
    setIsMoving(false);
  };

  const displayFields = (task.type?.boardConfig as any)?.cardFields || [];
  const fieldsToShow = task.type.fields.filter(f => displayFields.includes(f.id));

  return (
    <motion.div 
      layout
      className="glass"
      whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.3)' }}
      onClick={onClick}
      style={{ 
        padding: '20px', 
        cursor: 'pointer', 
        backgroundColor: 'rgba(255,255,255,0.03)',
        position: 'relative',
        border: isBlocked ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(255,255,255,0.05)',
        opacity: isMoving ? 0.5 : 1
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconRenderer name={task.type?.icon} color={task.type?.color} size={14} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{task.type?.name}</span>
        </div>
        {isBlocked && (
          <div title="Blocked by dependencies" style={{ color: '#ef4444' }}>
            <AlertCircle size={14} />
          </div>
        )}
      </div>

      <h4 style={{ fontSize: '0.95rem', fontWeight: 500, marginBottom: fieldsToShow.length > 0 ? '16px' : '24px', lineHeight: 1.5, color: '#e5e7eb' }}>{task.title}</h4>

      {/* Placeholders / Custom Fields */}
      {fieldsToShow.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
          {fieldsToShow.map(field => (
            <div key={field.id} style={{ fontSize: '0.65rem', color: '#9ca3af', backgroundColor: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '6px' }}>
              <strong>{field.name}: </strong> {task.content?.[field.id] || '---'}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {canMovePrev && (
            <button 
              onClick={(e) => handleMove(e, 'prev')}
              style={{ 
                background: 'rgba(255,255,255,0.05)', 
                border: 'none', 
                color: '#9ca3af', 
                borderRadius: '8px', 
                padding: '6px',
                cursor: 'pointer'
              }}
            >
              <ChevronLeft size={14} />
            </button>
          )}
          {canMoveNext && (
            <button 
              disabled={isBlocked && task.status === 'IN_PROGRESS'}
              onClick={(e) => handleMove(e, 'next')}
              style={{ 
                background: isBlocked && task.status === 'IN_PROGRESS' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)', 
                border: 'none', 
                color: isBlocked && task.status === 'IN_PROGRESS' ? '#ef4444' : '#3b82f6', 
                borderRadius: '8px', 
                padding: '6px',
                cursor: isBlocked && task.status === 'IN_PROGRESS' ? 'not-allowed' : 'pointer'
              }}
            >
              <ChevronRight size={14} />
            </button>
          )}
        </div>
        <span style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 600 }}>#{task.id.slice(-4).toUpperCase()}</span>
      </div>
    </motion.div>
  );
}

export function KanbanBoard({ initialSprint, initialNodes, columns, onRefresh, onNodeClick }: { initialSprint: any, initialNodes: any[], columns: any[], onRefresh: () => void, onNodeClick: (id: string) => void }) {
  if (!initialSprint) {
    return (
      <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
        <Calendar size={48} style={{ marginBottom: '24px' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>No Active Sprint</h3>
        <p style={{ fontSize: '0.875rem' }}>Go to the Sprints page to activate one.</p>
      </div>
    );
  }

  const handleMove = async (nodeId: string, direction: 'prev' | 'next') => {
    const node = initialNodes.find(n => n.id === nodeId);
    if (!node) return;

    const currentIndex = columns.findIndex(c => c.id === node.status);
    const targetIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < columns.length) {
      await updateNodeStatus(nodeId, columns[targetIndex].id);
      onRefresh();
    }
  };

  return (
    <div style={{ display: 'flex', gap: '24px', height: '100%', overflowX: 'auto', paddingBottom: '24px' }}>
      {columns.map((col, index) => (
        <KanbanColumn 
          key={col.id} 
          id={col.id} 
          title={col.title} 
          color={col.color} 
          icon={col.icon || Clock}
          canMovePrev={index > 0}
          canMoveNext={index < columns.length - 1}
          onMove={handleMove}
          onNodeClick={onNodeClick}
          tasks={initialNodes.filter((t: any) => t.status === col.id)} 
        />
      ))}
    </div>
  );
}
