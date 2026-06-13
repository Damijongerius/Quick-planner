import React from "react";
import { Node, NodeType, Sprint } from "@/lib/types";
import { assignNodeToSprint } from "@/lib/actions";
import { Select } from "./ui/Select";
import { getOptionColor } from "@/lib/utils/colorUtils";

interface Props {
  node: Node;
  colKey: string;
  sprints: Sprint[];
  progress: number;
  projectId: string;
  isReadOnly: boolean;
  nodeType: NodeType | null;
  onNodeUpdated?: () => void;
}

export function BacklogCellRenderer({
  node, 
  colKey, 
  sprints, 
  progress, 
  projectId, 
  isReadOnly,
  nodeType,
  onNodeUpdated
}: Props) {
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
