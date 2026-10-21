"use client";

import React from 'react';
import { FormField } from "./ui/FormField";
import { DependencyManager } from "./DependencyManager";
import { CustomFieldRenderer } from "./CustomFieldRenderer";
import { AutoGrowingTextarea } from "./ui/AutoGrowingTextarea";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { assignNodeToSprint, updateNodeStatus, updateNode, addDependency, removeDependency } from "@/lib/actions";
import { useProject } from "./ProjectContext";
import { useToast } from "./ui/Toast";
import { statusMeta } from "@/lib/statusMeta";
import { STATUS_OPTIONS } from "@/lib/statusMeta";
import { Node, Sprint, NodeType } from "@/lib/types";

interface NodeDetailsTabProps {
  node: Node;
  nodeTypes: NodeType[];
  title: string;
  setTitle: (val: string) => void;
  description: string;
  setDescription: (val: string) => void;
  status: string;
  setStatus: (val: string) => void;
  sprintId: string | null;
  setSprintId: (val: string | null) => void;
  assigneeId: string | null;
  setAssigneeId: (val: string | null) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  content: Record<string, unknown>;
  setContent: (val: (prev: Record<string, unknown>) => Record<string, unknown>) => void;
  sprints: Sprint[];
  allNodes: Node[];
  projectId: string;
  isReadOnly?: boolean;
  onNodeUpdated?: () => void;
}

export function NodeDetailsTab({ 
  node, nodeTypes, title, setTitle, description, setDescription, status, setStatus,
  sprintId, setSprintId, assigneeId, setAssigneeId, startDate, setStartDate, endDate, setEndDate,
  content, setContent, sprints, allNodes, projectId, isReadOnly, onNodeUpdated
}: Readonly<NodeDetailsTabProps>) {
  
  const isGanttEnabled = node.type?.boardConfig?.preferredView !== 'KANBAN';
  const isSprintEligible = node.type?.isSprintEligible !== false;

  const handleSprintChangeLocal = async (newId: string | null) => {
    if (isReadOnly) return;
    const previous = sprintId;
    setSprintId(newId);
    try {
      await assignNodeToSprint(projectId, node.id, newId);
    } catch (error) {
      console.error("Failed to change sprint", error);
      setSprintId(previous);
    }
    onNodeUpdated?.();
  };

  const handleStatusChangeLocal = async (newStatus: string) => {
    if (isReadOnly) return;
    const previous = status;
    setStatus(newStatus);
    try {
      await updateNodeStatus(projectId, node.id, newStatus);
      toast({
        message: `Status → ${statusMeta(newStatus).label}`,
        action: { label: "Undo", onClick: async () => { await updateNodeStatus(projectId, node.id, previous); setStatus(previous); onNodeUpdated?.(); } },
      });
    } catch (error) {
      console.error("Failed to change status", error);
      setStatus(previous);
    }
    onNodeUpdated?.();
  };

  const statusOptions = STATUS_OPTIONS;
  const { members, currentUserId } = useProject();
  const { toast } = useToast();

  const assigneeOptions = [
    { value: "none", label: "Unassigned" },
    ...members.map((m) => ({ value: m.id, label: m.isYou ? `${m.name || m.email} (you)` : (m.name || m.email || "Member") })),
  ];

  const handleAssigneeChange = async (newId: string | null) => {
    if (isReadOnly) return;
    const previous = assigneeId;
    setAssigneeId(newId);
    const result = await updateNode(projectId, node.id, { assigneeId: newId });
    if (result?.error) {
      alert(result.error);
      setAssigneeId(previous);
    }
    onNodeUpdated?.();
  };

  const sprintOptions = React.useMemo(() => {
    const activeAndPlanned = sprints.filter(s => s.status !== 'COMPLETED' || s.id === sprintId);
    return [
      { value: "none", label: "Backlog" },
      ...activeAndPlanned.map((s) => ({ value: s.id, label: s.name }))
    ];
  }, [sprints, sprintId]);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Input variant="seamless" className="!text-xl" value={title} onChange={(e) => !isReadOnly && setTitle(e.target.value)} placeholder="Untitled" disabled={isReadOnly} aria-label="Title" />
        <p className="mt-1 text-xs text-faint" suppressHydrationWarning>
          Created {new Date(node.createdAt).toLocaleDateString()} · Updated {new Date(node.updatedAt).toLocaleDateString()}
        </p>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: isSprintEligible ? "1fr 1fr" : "1fr" }}>
        <FormField label="Status">
          <Select options={statusOptions} value={status} onChange={handleStatusChangeLocal} disabled={isReadOnly} />
        </FormField>
        {isSprintEligible && (
          <FormField label="Sprint">
            <Select options={sprintOptions} value={sprintId || "none"} onChange={(val) => handleSprintChangeLocal(val === "none" ? null : val)} disabled={isReadOnly} />
          </FormField>
        )}
      </div>

      <FormField label="Assignee">
        <Select options={assigneeOptions} value={assigneeId || "none"} onChange={(val) => handleAssigneeChange(val === "none" ? null : val)} disabled={isReadOnly} />
        {!isReadOnly && assigneeId !== currentUserId && currentUserId && (
          <button type="button" onClick={() => handleAssigneeChange(currentUserId)} className="mt-1 text-xs text-accent hover:underline">Assign to me</button>
        )}
      </FormField>

      {isGanttEnabled && (
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Start date">
            <Input type="date" value={startDate} onChange={(e) => !isReadOnly && setStartDate(e.target.value)} disabled={isReadOnly} />
          </FormField>
          <FormField label="End date">
            <Input type="date" value={endDate} min={startDate || undefined} onChange={(e) => !isReadOnly && setEndDate(e.target.value)} disabled={isReadOnly} />
          </FormField>
        </div>
      )}

      <FormField label="Description">
        <AutoGrowingTextarea value={description} onChange={(e) => !isReadOnly && setDescription(e.target.value)} placeholder="Add more detail…" disabled={isReadOnly} />
      </FormField>

      <CustomFieldRenderer fields={nodeTypes.find(nt => nt.id === node.type?.id)?.fields || node.type?.fields || []} content={content} onChange={(name: string, val: string | number | boolean) => !isReadOnly && setContent((p) => ({ ...p, [name]: val }))} disabled={isReadOnly} />

      <DependencyManager
        dependencies={node.blockedBy || []}
        allNodes={allNodes}
        currentNodeId={node.id}
        disabled={isReadOnly}
        onAdd={async (id: string) => { if (!isReadOnly && id !== "none") { const result = await addDependency(projectId, node.id, id); if (result?.error) alert(result.error); onNodeUpdated?.(); } }}
        onRemove={async (id: string) => { if (!isReadOnly) { await removeDependency(projectId, id); onNodeUpdated?.(); } }}
      />
    </div>
  );
}
