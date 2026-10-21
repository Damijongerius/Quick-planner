"use client";

import React from "react";
import { ChevronRight, GripVertical, Loader2, Plus } from "lucide-react";
import type { DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import { IconRenderer } from "./IconPicker";
import { Node, NodeType, Sprint } from "@/lib/types";
import { assignNodeToSprint, updateNodeStatus, updateNode } from "@/lib/actions";
import { Avatar } from "./ui/Avatar";
import { PeerBadges } from "./realtime/PeerBadges";
import { useToast } from "./ui/Toast";
import { statusMeta } from "@/lib/statusMeta";
import { Select } from "./ui/Select";
import { StatusBadge } from "./ui/StatusBadge";
import { getOptionColor } from "@/lib/utils/colorUtils";
import { STATUS_OPTIONS, formatShortDate } from "@/lib/statusMeta";

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
  /** Present when this item can have children: shows a "+" button on hover. */
  onAddChild?: () => void;
  progress: number;
  selectedColumns?: string[];
  sprints?: Sprint[];
  selectedNodeType?: NodeType | null;
  isReadOnly?: boolean;
  onNodeUpdated?: () => void;
  /** Present when the row can be dragged to reorder it among its siblings. */
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
  /** Bulk selection. */
  checked?: boolean;
  anySelected?: boolean;
  onToggleChecked?: () => void;
}

export function BacklogNodeRow({
  projectId, node, nodeType, depth, isOpen, isSelected, isLoadingChildren, hasChildren,
  onToggle, onSelect, onAddChild, progress, selectedColumns, sprints, isReadOnly = false, onNodeUpdated,
  dragHandleProps, checked = false, anySelected = false, onToggleChecked,
}: Readonly<BacklogNodeRowProps>) {
  const color = nodeType?.color || "var(--accent)";
  const [editing, setEditing] = React.useState(false);
  const { toast } = useToast();

  const saveTitle = async (value: string) => {
    setEditing(false);
    const next = value.trim();
    if (!next || next === node.title) return;
    const result = await updateNode(projectId, node.id, { title: next });
    if (result?.error) alert(result.error);
    onNodeUpdated?.();
  };
  const columns = (selectedColumns ?? []).filter((c) => c !== "title");

  return (
    <div
      className={[
        "backlog-grid-row group relative grid cursor-pointer items-center border-b border-border pl-10 pr-3 transition-colors last:border-b-0",
        checked ? "bg-accent-soft" : isSelected ? "bg-accent-soft" : "hover:bg-hover",
        node.isArchived ? "opacity-60" : "",
      ].join(" ")}
      style={{ minHeight: 40 }}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
        if (e.key === "F2" && !isReadOnly) { e.preventDefault(); setEditing(true); }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${node.title}`}
    >
      <div className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5" onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
        {dragHandleProps && (
          <span {...dragHandleProps} aria-label={`Reorder ${node.title}`} className="flex h-6 w-4 cursor-grab items-center justify-center rounded text-faint opacity-0 transition-opacity hover:text-fg focus-visible:opacity-100 group-hover:opacity-100">
            <GripVertical size={14} />
          </span>
        )}
        {onToggleChecked && (
          <input
            type="checkbox"
            checked={checked}
            onChange={onToggleChecked}
            aria-label={`Select ${node.title}`}
            className={`checkbox-premium transition-opacity ${checked || anySelected ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"}`}
          />
        )}
      </div>

      <div
        className="@container/title flex min-w-0 items-center gap-2 overflow-hidden py-1.5 pr-3"
        style={{ paddingLeft: depth * 20 }}
        onDoubleClick={() => { if (!isReadOnly) setEditing(true); }}
        title={isReadOnly ? undefined : "Double-click to rename"}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onToggle(e); }}
          onDoubleClick={(e) => e.stopPropagation()}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded text-faint transition-all hover:bg-active hover:text-fg ${hasChildren ? "" : "invisible"}`}
          aria-label={isOpen ? "Collapse" : "Expand"}
          aria-expanded={isOpen}
        >
          {isLoadingChildren ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={16} className={`transition-transform ${isOpen ? "rotate-90" : ""}`} />}
        </button>

        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}
          title={nodeType?.name}
        >
          <IconRenderer name={nodeType?.icon || "Circle"} size={14} />
        </span>

        {editing ? (
          <input
            autoFocus
            defaultValue={node.title}
            maxLength={200}
            aria-label="Rename item"
            className="input-planner !h-7 min-w-0 flex-1"
            onClick={(e) => e.stopPropagation()}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => saveTitle(e.currentTarget.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") setEditing(false);
            }}
          />
        ) : (
          <span
            className={`truncate text-sm ${depth === 0 ? "font-medium" : ""} ${node.status === "DONE" ? "text-muted line-through decoration-faint" : "text-fg"}`}
          >
            {node.title}
          </span>
        )}
        {node.isArchived && <span className="badge-archived">Archived</span>}
        <PeerBadges nodeId={node.id} />
        {hasChildren && (
          <span className="ml-1 hidden shrink-0 items-center gap-1.5 text-xs text-faint @[300px]/title:flex" title={`${progress}% complete`}>
            <span className="relative h-1 w-10 overflow-hidden rounded-full bg-active">
              <span className="absolute inset-y-0 left-0 rounded-full bg-success" style={{ width: `${progress}%` }} />
            </span>
            {progress}%
          </span>
        )}
        {onAddChild && !editing && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddChild(); }}
            aria-label={`Add child item to ${node.title}`}
            title="Add child item"
            className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded text-faint opacity-0 transition-opacity hover:bg-active hover:text-fg focus-visible:opacity-100 group-hover:opacity-100"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {columns.map((colKey) => (
        <div key={colKey} className="min-w-0 pr-2" onClick={(e) => { if (!isReadOnly && (colKey === "status" || colKey === "sprintId")) e.stopPropagation(); }}>
          {renderCell(node, colKey, sprints ?? [], projectId, isReadOnly, nodeType, onNodeUpdated, toast)}
        </div>
      ))}
    </div>
  );
}

function renderCell(
  node: Node,
  colKey: string,
  sprints: Sprint[],
  projectId: string,
  isReadOnly: boolean,
  nodeType: NodeType | null,
  onNodeUpdated?: () => void,
  toast?: ReturnType<typeof useToast>["toast"]
) {
  if (colKey === "status") {
    if (isReadOnly) return <StatusBadge status={node.status} />;
    return (
      <Select
        options={STATUS_OPTIONS}
        value={node.status}
        onChange={async (val) => {
          const before = node.status;
          try {
            await updateNodeStatus(projectId, node.id, val);
            toast?.({
              message: `“${node.title}” → ${statusMeta(val).label}`,
              action: { label: "Undo", onClick: async () => { await updateNodeStatus(projectId, node.id, before); onNodeUpdated?.(); } },
            });
          } catch (error) {
            console.error("Failed to update status", error);
            alert("Could not change the status.");
          }
          onNodeUpdated?.();
        }}
        triggerClassName="inline-sprint-selector"
      />
    );
  }

  if (colKey === "sprintId") {
    const name = node.sprintId ? sprints.find((s) => s.id === node.sprintId)?.name ?? "Backlog" : "Backlog";
    if (isReadOnly) return <span className="truncate text-sm text-muted">{name}</span>;
    // Plain array, not a hook: this runs conditionally while rendering a row.
    const options = [
      { value: "none", label: "Backlog" },
      ...sprints.filter((s) => s.status !== "COMPLETED" || s.id === node.sprintId).map((s) => ({ value: s.id, label: s.name })),
    ];
    return (
      <Select
        options={options}
        value={node.sprintId || "none"}
        onChange={async (val) => {
          try {
            await assignNodeToSprint(projectId, node.id, val === "none" ? null : val);
          } catch (error) {
            console.error("Failed to assign sprint", error);
            alert("Could not move the item to that sprint.");
          }
          onNodeUpdated?.();
        }}
        triggerClassName="inline-sprint-selector"
      />
    );
  }

  if (colKey === "assignee") {
    return node.assignee ? (
      <span className="flex min-w-0 items-center gap-1.5 text-sm">
        <Avatar src={node.assignee.image} name={node.assignee.name} size="xs" />
        <span className="truncate">{node.assignee.name || node.assignee.email}</span>
      </span>
    ) : (
      <span className="text-sm text-faint">—</span>
    );
  }

  if (colKey === "startDate" || colKey === "endDate") {
    const value = colKey === "startDate" ? node.startDate : node.endDate;
    return value
      ? <span className="text-sm text-muted" suppressHydrationWarning>{formatShortDate(value)}</span>
      : <span className="text-sm text-faint">—</span>;
  }

  const value = node.content ? (node.content as Record<string, unknown>)[colKey] : undefined;
  if (value === undefined || value === null || value === "") return <span className="text-sm text-faint">—</span>;

  const fieldDef = nodeType?.fields?.find((f) => f.name === colKey);
  if (fieldDef?.type === "SELECT") {
    const opt = (fieldDef.options as unknown[] | null | undefined)?.find((o) => String(typeof o === "string" ? o : (o as { value?: unknown })?.value) === String(value));
    const optColor = opt && typeof opt !== "string" ? (opt as { color?: string }).color : undefined;
    const color = optColor || getOptionColor(String(value));
    return (
      <span className="inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-xs font-medium" style={{ color, background: `color-mix(in srgb, ${color} 14%, transparent)` }}>
        {String(value)}
      </span>
    );
  }
  if (typeof value === "boolean") {
    return <span className={`text-sm ${value ? "text-success" : "text-faint"}`}>{value ? "Yes" : "No"}</span>;
  }
  return <span className="block truncate text-sm text-fg">{String(value)}</span>;
}
