"use client";

import React from 'react';
import { FormField } from "./ui/FormField";
import { DependencyManager } from "./DependencyManager";
import { CustomFieldRenderer } from "./CustomFieldRenderer";
import { AutoGrowingTextarea } from "./ui/AutoGrowingTextarea";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { assignNodeToSprint, updateNodeStatus, addDependency, removeDependency } from "@/lib/actions";
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
  sprintId, setSprintId, startDate, setStartDate, endDate, setEndDate,
  content, setContent, sprints, allNodes, projectId, isReadOnly, onNodeUpdated
}: Readonly<NodeDetailsTabProps>) {
  
  const isGanttEnabled = node.type?.boardConfig?.preferredView !== 'KANBAN';
  const isSprintEligible = node.type?.isSprintEligible !== false;

  const handleSprintChangeLocal = async (newId: string | null) => {
    if (isReadOnly) return;
    setSprintId(newId);
    await assignNodeToSprint(projectId, node.id, newId);
    onNodeUpdated?.();
  };

  const handleStatusChangeLocal = async (newStatus: string) => {
    if (isReadOnly) return;
    setStatus(newStatus);
    await updateNodeStatus(projectId, node.id, newStatus);
    onNodeUpdated?.();
  };

  const statusOptions = [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "DONE", label: "Completed" }
  ];

  const sprintOptions = React.useMemo(() => {
    const activeAndPlanned = sprints.filter(s => s.status !== 'COMPLETED' || s.id === sprintId);
    return [
      { value: "none", label: "Backlog" },
      ...activeAndPlanned.map((s) => ({ value: s.id, label: s.name }))
    ];
  }, [sprints, sprintId]);

  return (
    <div className="flex flex-col gap-md">
      <div>
          <Input variant="seamless" className="side-panel-title" value={title} onChange={(e) => !isReadOnly && setTitle(e.target.value)} placeholder="Enter title..." disabled={isReadOnly} />
          <div className="flex gap-md text-meta-subtle">
              <span suppressHydrationWarning>Created {new Date(node.createdAt).toLocaleDateString()}</span>
              <span suppressHydrationWarning>Updated {new Date(node.updatedAt).toLocaleDateString()}</span>
          </div>
      </div>

      <div className="side-panel-config-grid" style={{ '--grid-columns': isSprintEligible ? '1fr 1fr' : '1fr' } as React.CSSProperties}>
          <FormField label="Status">
            <Select 
              options={statusOptions}
              value={status}
              onChange={handleStatusChangeLocal}
              disabled={isReadOnly}
            />
          </FormField>

           {isSprintEligible && (
               <FormField label="Sprint">
                 <Select 
                   options={sprintOptions}
                   value={sprintId || "none"}
                   onChange={(val) => handleSprintChangeLocal(val === 'none' ? null : val)}
                   disabled={isReadOnly}
                 />
               </FormField>
           )}
      </div>

      {isGanttEnabled && (
          <div className="timeline-container">
              <div className="col-span-2"><span className="text-meta text-primary">Strategic Timeline</span></div>
                <FormField label="Start">
                    <Input type="date" variant="premium" value={startDate} onChange={(e) => !isReadOnly && setStartDate(e.target.value)} disabled={isReadOnly} />
                </FormField>
                <FormField label="End">
                    <Input type="date" variant="premium" value={endDate} onChange={(e) => !isReadOnly && setEndDate(e.target.value)} disabled={isReadOnly} />
                </FormField>
          </div>
      )}

       <FormField label="Description">
           <AutoGrowingTextarea className="side-panel-desc" value={description} onChange={(e) => !isReadOnly && setDescription(e.target.value)} placeholder="Provide strategic context..." disabled={isReadOnly} />
       </FormField>

       <DependencyManager dependencies={node.blockedBy || []} allNodes={allNodes} currentNodeId={node.id} onAdd={async (id: string) => { if (!isReadOnly && id !== 'none') await addDependency(projectId, node.id, id); }} onRemove={async (id: string) => !isReadOnly && await removeDependency(projectId, id)} />

       <CustomFieldRenderer fields={nodeTypes.find(nt => nt.id === node.type?.id)?.fields || node.type?.fields || []} content={content} onChange={(name: string, val: string | number | boolean) => !isReadOnly && setContent((p) => ({ ...p, [name]: val }))} disabled={isReadOnly} />
    </div>
  );
}
