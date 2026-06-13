"use client";
import "./Backlog.css";
import "./ui/Progress.css";
import "./ui/Badge.css";

import React from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { IconRenderer } from "./IconPicker";
import { Node, NodeType, Sprint } from "@/lib/types";
import { BacklogCellRenderer } from "./BacklogCellRenderer";

interface BacklogNodeRowProps {
  projectId: string;
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
  progress: number;
  selectedColumns?: string[];
  sprints?: Sprint[];
  selectedNodeType?: NodeType | null;
  isReadOnly?: boolean;
  onNodeUpdated?: () => void;
}

export function BacklogNodeRow({
  projectId,
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
  progress,
  selectedColumns,
  sprints,
  selectedNodeType,
  isReadOnly = false,
  onNodeUpdated
}: Readonly<BacklogNodeRowProps>) {
  return (
    <div 
      className={`backlog-row-container ${isSelected ? 'selected' : ''} ${node.isArchived ? 'archived' : ''}`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      role="button"
      tabIndex={0}
      style={{ 
        '--depth-padding': `${depth * 28 + 24}px`,
        borderLeft: depth === 0 ? `4px solid ${nodeType?.color || 'var(--primary)'}` : 'none',
        gridTemplateColumns: getGridTemplate(selectedColumns?.length || 1),
        paddingLeft: '24px',
        paddingRight: '24px'
      } as React.CSSProperties}
    >
      <div className="backlog-row-content flex items-center gap-md min-w-0">
        <button 
          onClick={(e) => { e.stopPropagation(); onToggle(e); }}
          className={`backlog-row-toggle ${isOpen ? 'open' : ''} ${hasChildren || isHovered ? 'visible' : ''}`}
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
            borderRadius: '8px',
            marginLeft: `calc(var(--depth-padding) - 24px)`
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
        </div>
      </div>

      {selectedColumns?.filter(c => c !== 'title').map((colKey) => (
        <div key={colKey} className="min-w-0 w-full text-left flex items-center">
          <BacklogCellRenderer
            node={node}
            colKey={colKey}
            sprints={sprints || []}
            progress={progress}
            projectId={projectId}
            isReadOnly={isReadOnly}
            nodeType={nodeType}
            onNodeUpdated={onNodeUpdated}
          />
        </div>
      ))}
    </div>
  );
}

function getGridTemplate(numCols: number): string {
  if (numCols <= 1) return "1fr";
  if (numCols === 2) return "3fr 1.2fr";
  if (numCols === 3) return "3fr 1.2fr 1.2fr";
  return "3fr 1.2fr 1.2fr 1.2fr"; 
}
