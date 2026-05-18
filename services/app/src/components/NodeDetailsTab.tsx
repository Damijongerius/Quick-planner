"use client";

import React from 'react';
import { FormField } from "./ui/FormField";
import { DependencyManager } from "./DependencyManager";
import { CustomFieldRenderer } from "./CustomFieldRenderer";
import { AutoGrowingTextarea } from "./ui/AutoGrowingTextarea";
import { assignNodeToSprint, updateNodeStatus, addDependency, removeDependency } from "@/lib/actions";
import { Node, Sprint } from "@/lib/types";

interface NodeDetailsTabProps {
  node: Node;
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
}

export function NodeDetailsTab({ 
  node, title, setTitle, description, setDescription, status, setStatus,
  sprintId, setSprintId, startDate, setStartDate, endDate, setEndDate,
  content, setContent, sprints, allNodes, projectId, isReadOnly
}: Readonly<NodeDetailsTabProps>) {
  
  const isGanttEnabled = node.type?.boardConfig?.preferredView !== 'KANBAN';
  const isSprintEligible = node.type?.isSprintEligible !== false;

  const handleSprintChangeLocal = async (newId: string | null) => {
    if (isReadOnly) return;
    setSprintId(newId);
    await assignNodeToSprint(projectId, node.id, newId);
  };

  const handleStatusChangeLocal = async (newStatus: string) => {
    if (isReadOnly) return;
    setStatus(newStatus);
    await updateNodeStatus(projectId, node.id, newStatus);
  };

  return (
    <div className="flex flex-col gap-xl">
      <div>
          <input className="input-seamless side-panel-title" value={title} onChange={(e) => !isReadOnly && setTitle(e.target.value)} placeholder="Enter title..." disabled={isReadOnly} />
          <div className="flex gap-md text-meta-subtle">
              <span suppressHydrationWarning>Created {new Date(node.createdAt).toLocaleDateString()}</span>
              <span suppressHydrationWarning>Updated {new Date(node.updatedAt).toLocaleDateString()}</span>
          </div>
      </div>

      <div className="side-panel-config-grid" style={{ '--grid-columns': isSprintEligible ? '1fr 1fr' : '1fr' } as React.CSSProperties}>
          <FormField label="Status">
            <select className="input-premium w-full p-md" value={status} onChange={(e) => handleStatusChangeLocal(e.target.value)} disabled={isReadOnly}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Completed</option>
            </select>
          </FormField>

           {isSprintEligible && (
               <FormField label="Sprint">
                 <select className="input-premium w-full p-md" value={sprintId || "none"} onChange={(e) => handleSprintChangeLocal(e.target.value === 'none' ? null : e.target.value)} disabled={isReadOnly}>
                   <option value="none">Backlog</option>
                   {sprints.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                 </select>
               </FormField>
           )}
      </div>

      {isGanttEnabled && (
          <div className="timeline-container">
              <div className="col-span-2"><span className="text-meta text-primary">Strategic Timeline</span></div>
               <FormField label="Start">
                   <input type="date" className="input-premium" value={startDate} onChange={(e) => !isReadOnly && setStartDate(e.target.value)} disabled={isReadOnly} />
               </FormField>
               <FormField label="End">
                   <input type="date" className="input-premium" value={endDate} onChange={(e) => !isReadOnly && setEndDate(e.target.value)} disabled={isReadOnly} />
               </FormField>
          </div>
      )}

       <FormField label="Description">
           <AutoGrowingTextarea className="side-panel-desc" value={description} onChange={(e) => !isReadOnly && setDescription(e.target.value)} placeholder="Provide strategic context..." disabled={isReadOnly} />
       </FormField>

       <DependencyManager dependencies={node.blockedBy || []} allNodes={allNodes} currentNodeId={node.id} onAdd={async (id: string) => { if (!isReadOnly && id !== 'none') await addDependency(projectId, node.id, id); }} onRemove={async (id: string) => !isReadOnly && await removeDependency(projectId, id)} />

       <CustomFieldRenderer fields={node.type?.fields || []} content={content} onChange={(name: string, val: string | number | boolean) => !isReadOnly && setContent((p) => ({ ...p, [name]: val }))} disabled={isReadOnly} />
    </div>
  );
}
