"use client";

import React from 'react';
import { FormField } from "./ui/FormField";
import { DependencyManager } from "./DependencyManager";
import { CustomFieldRenderer } from "./CustomFieldRenderer";
import { assignNodeToSprint, updateNodeStatus, addDependency, removeDependency } from "@/lib/actions";

interface NodeDetailsTabProps {
  node: any;
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
  content: any;
  setContent: (val: any) => void;
  sprints: any[];
  allNodes: any[];
  projectId: string;
}

export function NodeDetailsTab({ 
  node, title, setTitle, description, setDescription, status, setStatus,
  sprintId, setSprintId, startDate, setStartDate, endDate, setEndDate,
  content, setContent, sprints, allNodes, projectId 
}: NodeDetailsTabProps) {
  
  const isGanttEnabled = node.type?.boardConfig?.preferredView !== 'KANBAN';
  const isSprintEligible = node.type?.isSprintEligible !== false;

  const handleSprintChangeLocal = async (newId: string | null) => {
    setSprintId(newId);
    await assignNodeToSprint(projectId, node.id, newId);
  };

  const handleStatusChangeLocal = async (newStatus: string) => {
    setStatus(newStatus);
    await updateNodeStatus(projectId, node.id, newStatus);
  };

  return (
    <div className="flex flex-col gap-xl">
      <div>
          <input className="input-seamless side-panel-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title..." />
          <div className="flex gap-md text-meta-subtle">
              <span>Created {new Date(node.createdAt).toLocaleDateString()}</span>
              <span>Updated {new Date(node.updatedAt).toLocaleDateString()}</span>
          </div>
      </div>

      <div className="side-panel-config-grid" style={{ '--grid-columns': isSprintEligible ? '1fr 1fr' : '1fr' } as any}>
          <FormField label="Status">
            <select className="button-secondary w-full p-md" value={status} onChange={(e) => handleStatusChangeLocal(e.target.value)}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Completed</option>
            </select>
          </FormField>

          {isSprintEligible && (
              <FormField label="Sprint">
                <select className="button-secondary w-full p-md" value={sprintId || "none"} onChange={(e) => handleSprintChangeLocal(e.target.value === 'none' ? null : e.target.value)}>
                  <option value="none">Backlog</option>
                  {sprints.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </FormField>
          )}
      </div>

      {isGanttEnabled && (
          <div className="timeline-container">
              <div className="col-span-2"><label className="text-meta text-primary">Strategic Timeline</label></div>
              <FormField label="Start">
                  <input type="date" className="input-sanctuary" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </FormField>
              <FormField label="End">
                  <input type="date" className="input-sanctuary" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </FormField>
          </div>
      )}

      <FormField label="Description">
          <textarea className="input-sanctuary side-panel-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Provide strategic context..." />
      </FormField>

      <DependencyManager dependencies={node.blockedBy} allNodes={allNodes} currentNodeId={node.id} onAdd={async (id: string) => { if (id !== 'none') await addDependency(projectId, node.id, id); }} onRemove={async (id: string) => await removeDependency(projectId, id)} />

      <CustomFieldRenderer fields={node.type?.fields} content={content} onChange={(name: string, val: any) => setContent((p: any) => ({ ...p, [name]: val }))} />
    </div>
  );
}
