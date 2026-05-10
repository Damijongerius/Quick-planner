"use client";

import { useState, useEffect, useRef } from "react";
import { X, Calendar, Type, Clock, Archive, ArchiveRestore, Play, CheckCircle2 } from "lucide-react";
import { updateNode, assignNodeToSprint, updateNodeStatus, addDependency, removeDependency, getHistoryForNode, archiveNode } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { IconRenderer } from "./IconPicker";
import { CustomFieldRenderer } from "./CustomFieldRenderer";
import { AuditTrail } from "./AuditTrail";
import { DependencyManager } from "./DependencyManager";
import { Button } from "./ui/Button";
import { SegmentedControl } from "./ui/SegmentedControl";
import { FormField } from "./ui/FormField";

interface NodeSidePanelProps {
  projectId: string;
  node: any;
  isOpen: boolean;
  onClose: () => void;
  sprints: any[];
  allNodes: any[];
}

export function NodeSidePanel({ projectId, node, isOpen, onClose, sprints, allNodes }: NodeSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [content, setContent] = useState<any>({});
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [status, setStatus] = useState("TODO");
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [history, setHistory] = useState<any[]>([]);
  
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (node) {
      syncNodeDataToState({
        node, setTitle, setDescription, setStartDate, setEndDate, 
        setContent, setSprintId, setStatus, setSavingStatus, 
        isInitialMount, setActiveTab
      });
      if (activeTab === 'history') {
        loadHistoryData(projectId, node.id, setHistory);
      }
    }
  }, [node?.id, node?.updatedAt]);

  useEffect(() => {
    if (activeTab === 'history' && node?.id) {
      loadHistoryData(projectId, node.id, setHistory);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    
    performAutosave({
      projectId, node, title, description, content, startDate, endDate,
      setSavingStatus, saveTimeoutRef
    });

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [title, description, content, startDate, endDate, projectId, node?.id]);

  if (!node) return null;

  return (
    <div className="side-panel-container card-sanctuary p-none">
      <PanelHeader 
        node={node} 
        savingStatus={savingStatus} 
        onClose={onClose} 
      />

      <PanelTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
      />

      <div className="side-panel-scroll-area flex-1 overflow-y-auto">
        {activeTab === 'details' ? (
          <NodeDetailsTab 
            node={node}
            title={title}
            setTitle={setTitle}
            description={description}
            setDescription={setDescription}
            status={status}
            setStatus={setStatus}
            sprintId={sprintId}
            setSprintId={setSprintId}
            startDate={startDate}
            setStartDate={setStartDate}
            endDate={endDate}
            setEndDate={setEndDate}
            content={content}
            setContent={setContent}
            sprints={sprints}
            allNodes={allNodes}
            projectId={projectId}
          />
        ) : (
          <AuditTrail history={history} />
        )}
      </div>

      <PanelFooter 
        isArchived={node.isArchived} 
        onArchiveToggle={() => handleArchiveToggle(projectId, node, onClose)} 
      />
    </div>
  );
}

// --- Implementation Details (The Prose) ---

function syncNodeDataToState(params: any) {
  const { node, setTitle, setDescription, setStartDate, setEndDate, setContent, setSprintId, setStatus, setSavingStatus, isInitialMount, setActiveTab } = params;
  setTitle(node.title || "");
  setDescription(node.description || "");
  setStartDate(node.startDate ? new Date(node.startDate).toISOString().split('T')[0] : "");
  setEndDate(node.endDate ? new Date(node.endDate).toISOString().split('T')[0] : "");
  setContent(node.content || {});
  setSprintId(node.sprintId || null);
  setStatus(node.status || "TODO");
  setSavingStatus('idle');
  isInitialMount.current = true;
  setActiveTab('details');
}

async function loadHistoryData(projectId: string, nodeId: string, setHistory: Function) {
  const data = await getHistoryForNode(projectId, nodeId);
  setHistory(data);
}

function performAutosave(params: any) {
  const { projectId, node, title, description, content, startDate, endDate, setSavingStatus, saveTimeoutRef } = params;
  setSavingStatus('saving');
  if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
  
  saveTimeoutRef.current = setTimeout(async () => {
    try {
      await updateNode(projectId, node.id, { title, description, content, startDate: startDate || null, endDate: endDate || null });
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 2000);
    } catch (error) { 
      setSavingStatus('idle'); 
    }
  }, 500);
}

async function handleArchiveToggle(projectId: string, node: any, onClose: Function) {
  await archiveNode(projectId, node.id, !node.isArchived);
  onClose();
}

function PanelHeader({ node, savingStatus, onClose }: any) {
  return (
    <header className="side-panel-header">
      <div className="flex items-center gap-md">
        <div 
          className="side-panel-icon-container" 
          style={{ '--node-color': node.type?.color || 'var(--primary)' } as any}
        >
          <IconRenderer name={node.type?.icon} size={18} />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-sm">
              <span className="text-meta">{node.type?.name}</span>
              {node.isArchived && <span className="badge-archived">ARCHIVED</span>}
          </div>
          <SavingIndicator status={savingStatus} />
        </div>
      </div>
      <Button variant="ghost" onClick={onClose} size="sm"><X size={20} /></Button>
    </header>
  );
}

function SavingIndicator({ status }: { status: string }) {
  if (status === 'saving') return <div className="saving-status-text text-primary">AUTOSAVING...</div>;
  if (status === 'saved') return <div className="saving-status-text text-tertiary">SAVED</div>;
  return <div className="saving-status-text text-secondary">SYNCED</div>;
}

function PanelTabs({ activeTab, onTabChange }: any) {
  return (
    <div className="side-panel-tabs-wrapper border-b">
        <SegmentedControl 
          options={[
              { id: 'details', label: 'DETAILS' },
              { id: 'history', label: 'HISTORY', icon: <Clock size={14} /> }
          ]}
          value={activeTab}
          onChange={(id) => onTabChange(id as any)}
        />
    </div>
  );
}

function NodeDetailsTab({ 
  node, title, setTitle, description, setDescription, status, setStatus,
  sprintId, setSprintId, startDate, setStartDate, endDate, setEndDate,
  content, setContent, sprints, allNodes, projectId 
}: any) {
  
  const isGanttEnabled = node.type?.boardConfig?.preferredView !== 'KANBAN';
  const isSprintEligible = node.type?.isSprintEligible !== false;

  return (
    <div className="flex flex-col gap-xl">
      <div>
          <input 
            className="input-seamless side-panel-title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            placeholder="Enter title..." 
          />
          <div className="flex gap-md text-meta-subtle">
              <span>Created {new Date(node.createdAt).toLocaleDateString()}</span>
              <span>Updated {new Date(node.updatedAt).toLocaleDateString()}</span>
          </div>
      </div>

      <div 
          className="side-panel-config-grid"
          style={{ '--grid-columns': isSprintEligible ? '1fr 1fr' : '1fr' } as any}
      >
          <FormField label="Status">
            <select className="button-secondary w-full p-md" value={status} onChange={(e) => handleStatusChange(projectId, node.id, e.target.value, setStatus)}>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Completed</option>
            </select>
          </FormField>

          {isSprintEligible && (
              <FormField label="Sprint">
                <select className="button-secondary w-full p-md" value={sprintId || "none"} onChange={(e) => handleSprintChange(projectId, node.id, e.target.value === 'none' ? null : e.target.value, setSprintId)}>
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
                  <input type="date" className="input-premium" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </FormField>
              <FormField label="End">
                  <input type="date" className="input-premium" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </FormField>
          </div>
      )}

      <FormField label="Description">
          <textarea 
            className="input-premium side-panel-desc" 
            value={description} 
            onChange={(e) => setDescription(e.target.value)} 
            placeholder="Provide strategic context..." 
          />
      </FormField>

      <DependencyManager 
        dependencies={node.blockedBy} 
        allNodes={allNodes} 
        currentNodeId={node.id} 
        onAdd={async (id: string) => { if (id !== 'none') await addDependency(projectId, node.id, id); }} 
        onRemove={async (id: string) => await removeDependency(projectId, id)} 
      />

      <CustomFieldRenderer 
        fields={node.type?.fields} 
        content={content} 
        onChange={(name: string, val: any) => setContent((p: any) => ({ ...p, [name]: val }))} 
      />
    </div>
  );
}

async function handleSprintChange(projectId: string, nodeId: string, newId: string | null, setSprintId: Function) {
  setSprintId(newId);
  await assignNodeToSprint(projectId, nodeId, newId);
}

async function handleStatusChange(projectId: string, nodeId: string, newStatus: string, setStatus: Function) {
  setStatus(newStatus);
  await updateNodeStatus(projectId, nodeId, newStatus);
}

function PanelFooter({ isArchived, onArchiveToggle }: any) {
  return (
    <footer className="side-panel-footer border-t">
      <Button 
        variant="secondary" 
        onClick={onArchiveToggle} 
        className="w-full" 
        icon={isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
      >
        {isArchived ? "Restore Node" : "Archive Node"}
      </Button>
    </footer>
  );
}

