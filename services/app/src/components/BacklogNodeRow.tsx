"use client";

import React from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { IconRenderer } from "./IconPicker";

interface BacklogNodeRowProps {
  node: any;
  nodeType: any;
  depth: number;
  isOpen: boolean;
  isSelected: boolean;
  isLoadingChildren: boolean;
  hasChildren: boolean;
  isHovered: boolean;
  onToggle: (e: React.MouseEvent) => void;
  onSelect: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
  progress: number;
}

export function BacklogNodeRow({
  node,
  nodeType,
  depth,
  isOpen,
  isSelected,
  isLoadingChildren,
  hasChildren,
  isHovered,
  onToggle,
  onSelect,
  onContextMenu,
  progress
}: BacklogNodeRowProps) {
  return (
    <div 
      className={`backlog-row ${isSelected ? 'selected' : ''} ${node.isArchived ? 'archived' : ''}`}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      style={{ 
        '--depth-padding': `${depth * 40 + 24}px`,
        borderLeft: depth === 0 ? `4px solid ${nodeType?.color || 'var(--primary)'}` : 'none'
      } as any}
    >
      <div className="flex items-center gap-md flex-1 min-w-0">
        <div 
          onClick={(e) => { e.stopPropagation(); onToggle(e); }}
          className={`backlog-row-toggle ${isOpen ? 'open' : ''} ${hasChildren || isHovered ? 'visible' : ''}`}
        >
          {isLoadingChildren ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={18} />}
        </div>
        
        <div 
          className={`backlog-row-icon ${depth === 0 ? 'root' : ''}`} 
          style={{ 
            '--node-color': nodeType?.color || 'var(--primary)',
            backgroundColor: depth === 0 ? 'transparent' : 'color-mix(in srgb, var(--node-color) 10%, transparent)',
            color: 'var(--node-color)',
            padding: '8px',
            borderRadius: '8px'
          } as any}
        >
          <IconRenderer name={nodeType?.icon || (depth === 0 ? 'Folder' : 'Circle')} size={depth === 0 ? 20 : 16} />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-sm">
            <span className={`backlog-node-title ${depth === 0 ? 'root' : ''} tracking-tight`}>
              {node.title}
            </span>
            {node.isArchived && <span className="badge-archived">ARCHIVED</span>}
          </div>
          {depth === 0 && (
              <span className="text-meta node-type-label opacity-40">
                {nodeType?.name || 'Node'}
              </span>
          )}

          {/* Custom Fields Preview */}
          {Object.keys(node.content || {}).length > 0 && (
            <div className="flex flex-wrap gap-xs mt-xs">
              {Object.entries(node.content || {}).map(([key, value]) => {
                  if (!value || key.toLowerCase() === 'priority' || key.toLowerCase() === 'status') return null;
                  return (
                      <div key={key} className="node-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
                          <span className="node-badge-key">{key.toUpperCase()}</span>
                          <span className="node-badge-value">{String(value)}</span>
                      </div>
                  )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-xl ml-xl">
        {node.status === 'DONE' ? (
          <div className="status-done-badge">
             <div className="w-2 h-2 rounded-full bg-tertiary" />
             DONE
          </div>
        ) : (
          <div className="flex items-center gap-sm">
            <span className="text-[10px] font-bold opacity-40">{progress}%</span>
            <div className="progress-container" style={{ width: '80px', height: '4px' }}>
               <div className="progress-bar" style={{ '--progress-width': `${progress}%` } as any} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
