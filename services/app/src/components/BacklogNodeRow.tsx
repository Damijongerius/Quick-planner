"use client";
import "./Backlog.css";
import "./ui/Progress.css";
import "./ui/Badge.css";

import React from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { IconRenderer } from "./IconPicker";
import { Node, NodeType } from "@/lib/types";

interface BacklogNodeRowProps {
  node: Node & { isArchived?: boolean };
  nodeType: NodeType | null;
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
}: Readonly<BacklogNodeRowProps>) {
  return (
    <div 
      className={`backlog-row-container ${isSelected ? 'selected' : ''} ${node.isArchived ? 'archived' : ''}`}
      onContextMenu={onContextMenu}
      style={{ 
        '--depth-padding': `${depth * 40 + 24}px`,
        borderLeft: depth === 0 ? `4px solid ${nodeType?.color || 'var(--primary)'}` : 'none'
      } as React.CSSProperties}
    >
      <button 
        className="backlog-row-main-action"
        onClick={onSelect}
        aria-label={`Select ${node.title}`}
      />
      
      <div className="backlog-row-content flex items-center gap-md flex-1 min-w-0 pointer-events-none">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(e); }}
          className={`backlog-row-toggle pointer-events-auto border-none bg-transparent p-0 cursor-pointer ${isOpen ? 'open' : ''} ${hasChildren || isHovered ? 'visible' : ''}`}
          aria-label={isOpen ? "Collapse" : "Expand"}
        >
          {isLoadingChildren ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <ChevronRight size={18} />
          )}
        </button>
        
        <div 
          className={`backlog-row-icon ${depth === 0 ? 'root' : ''}`} 
          style={{ 
            '--node-color': nodeType?.color || 'var(--primary)',
            backgroundColor: depth === 0 ? 'transparent' : 'color-mix(in srgb, var(--node-color) 10%, transparent)',
            color: 'var(--node-color)',
            padding: '8px',
            borderRadius: '8px'
          } as React.CSSProperties}
        >
          <IconRenderer name={nodeType?.icon || (depth === 0 ? 'Folder' : 'Circle')} size={depth === 0 ? 20 : 16} />
        </div>

        <div className="flex flex-col min-w-0 flex-1 gap-xs">
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
              {Object.entries(node.content || {})
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => {
                  if (!value || key.toLowerCase() === 'priority' || key.toLowerCase() === 'status') return null;
                  return (
                      <div key={key} className="node-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>
                          <span className="node-badge-key">{key.toUpperCase()}</span>
                          <span className="node-badge-value">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                      </div>
                  )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-xl ml-xl pointer-events-none">
        {node.status === 'DONE' ? (
          <div className="status-done-badge">
             <div className="w-2 h-2 rounded-full bg-tertiary" />
             DONE
          </div>
        ) : (
          <div className="flex items-center gap-sm">
            <span className="text-10px font-bold opacity-40">{progress}%</span>
            <div className="progress-container" style={{ width: '80px', height: '4px' }}>
               <div className="progress-bar" style={{ '--progress-width': `${progress}%` } as React.CSSProperties} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
