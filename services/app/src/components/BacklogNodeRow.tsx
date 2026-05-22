"use client";
import "./Backlog.css";
import "./ui/Progress.css";
import "./ui/Badge.css";

import React from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { IconRenderer } from "./IconPicker";
import { Node, NodeType, Sprint } from "@/lib/types";
import { assignNodeToSprint } from "@/lib/actions";
import { Select } from "./ui/Select";
import { getOptionColor } from "@/lib/utils/colorUtils";

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
      {/* Column 1: Title Hierarchy */}
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

      {/* Columns 2-4: Direct Children Grid Cells */}
      {selectedColumns?.filter(c => c !== 'title').map((colKey) => (
        <div key={colKey} className="min-w-0 w-full text-left flex items-center">
          {getRowCellContent(node, colKey, sprints || [], progress, projectId, isReadOnly, nodeType, onNodeUpdated)}
        </div>
      ))}
    </div>
  );
}

// ==========================================
// PURE HELPER FUNCTIONS (Code as Prose)
// ==========================================

function getGridTemplate(numCols: number): string {
  if (numCols <= 1) return "1fr";
  if (numCols === 2) return "3fr 1.2fr";
  if (numCols === 3) return "3fr 1.2fr 1.2fr";
  return "3fr 1.2fr 1.2fr 1.2fr"; // Synchronized left-connected grid widths
}

function getRowCellContent(
  node: Node, 
  colKey: string, 
  sprints: Sprint[], 
  progress: number, 
  projectId: string, 
  isReadOnly: boolean,
  nodeType: NodeType | null,
  onNodeUpdated?: () => void
) {
  if (colKey === 'status') {
    const label = node.status === 'DONE' ? 'Completed' : node.status === 'IN_PROGRESS' ? 'In Progress' : 'To Do';
    const statusClass = node.status === 'DONE' ? 'status-done' : node.status === 'IN_PROGRESS' ? 'status-progress' : 'status-todo';
    return (
      <span className={`status-pill ${statusClass}`} style={{ fontSize: '10px', padding: '3px 10px' }}>
        {label}
      </span>
    );
  }

  if (colKey === 'sprintId') {
    const sprintName = !node.sprintId ? "Backlog" : sprints.find(s => s.id === node.sprintId)?.name || "Backlog";
    if (isReadOnly) {
      return <span className="text-sm font-semibold text-on-surface-variant truncate block">{sprintName}</span>;
    }
    const sprintOptions = React.useMemo(() => {
      const sprintList = sprints || [];
      const filtered = sprintList.filter(s => s.status !== 'COMPLETED' || s.id === node.sprintId);
      return [
        { value: "none", label: "Backlog" },
        ...filtered.map(s => ({ value: s.id, label: s.name }))
      ];
    }, [sprints, node.sprintId]);
    return (
      <div style={{ width: 'auto', maxWidth: '140px' }} onClick={(e) => e.stopPropagation()}>
        <Select
          options={sprintOptions}
          value={node.sprintId || "none"}
          onChange={async (val) => {
            const sprintVal = val === 'none' ? null : val;
            await assignNodeToSprint(projectId, node.id, sprintVal);
            onNodeUpdated?.();
          }}
          triggerClassName="inline-sprint-selector py-xs px-sm text-xs font-semibold"
        />
      </div>
    );
  }

  if (colKey === 'startDate') {
    return <span className="text-sm text-on-surface-variant">{node.startDate ? new Date(node.startDate).toLocaleDateString() : "-"}</span>;
  }

  if (colKey === 'endDate') {
    return <span className="text-sm text-on-surface-variant">{node.endDate ? new Date(node.endDate).toLocaleDateString() : "-"}</span>;
  }

  // Custom Fields
  const value = node.content ? (node.content as Record<string, unknown>)[colKey] : undefined;
  if (value === undefined || value === null || value === "") {
    return <span className="text-sm opacity-35">-</span>;
  }

  const fieldDef = nodeType?.fields?.find(f => f.name === colKey);
  if (fieldDef?.type === 'SELECT') {
    const optConfig = fieldDef.options?.find(opt => {
      const val = typeof opt === 'string' ? opt : (opt as any)?.value;
      return String(val) === String(value);
    });
    const color = (optConfig && typeof optConfig !== 'string' && (optConfig as any)?.color)
      ? (optConfig as any).color
      : getOptionColor(String(value));
      
    return (
      <span 
        className="status-pill" 
        style={{ 
          fontSize: '10px', 
          padding: '3px 10px',
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          color: color,
          border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
          fontWeight: 700
        }}
      >
        {String(value)}
      </span>
    );
  }

  if (typeof value === 'boolean') {
    return (
      <span className={`status-pill ${value ? 'status-done' : 'status-todo'}`} style={{ fontSize: '9px', padding: '2px 8px' }}>
        {value ? "YES" : "NO"}
      </span>
    );
  }

  return <span className="backlog-cell-text">{String(value)}</span>;
}
