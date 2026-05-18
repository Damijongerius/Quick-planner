"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Clock, Archive, ArchiveRestore } from "lucide-react";
import { updateNode, getHistoryForNode, archiveNode } from "@/lib/actions";
import { IconRenderer } from "./IconPicker";
import { AuditTrail } from "./AuditTrail";
import { Button } from "./ui/Button";
import { SegmentedControl } from "./ui/SegmentedControl";
import { NodeDetailsTab } from "./NodeDetailsTab";
import "./NodeSidePanel.css";
import "./Timeline.css";

import { Node, Sprint, AuditLogEvent } from "@/lib/types";

export function NodeSidePanel({ projectId, node, onClose, sprints, allNodes }: Readonly<{ projectId: string; node: Node; isOpen?: boolean; onClose: () => void; sprints: Sprint[]; allNodes: Node[] }>) {
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details');
  const [title, setTitle] = useState(node.title || "");
  const [description, setDescription] = useState(node.description || "");
  const [startDate, setStartDate] = useState(node.startDate ? new Date(node.startDate).toISOString().split('T')[0] : "");
  const [endDate, setEndDate] = useState(node.endDate ? new Date(node.endDate).toISOString().split('T')[0] : "");
  const [content, setContent] = useState<Record<string, unknown>>((node.content as Record<string, unknown>) || {});
  const [sprintId, setSprintId] = useState<string | null>(node.sprintId || null);
  const [status, setStatus] = useState(node.status || "TODO");
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [history, setHistory] = useState<AuditLogEvent[]>([]);
  
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastNodeIdRef = useRef(node.id);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Reset local states when a different node is selected
  useEffect(() => {
    setTitle(node.title || "");
    setDescription(node.description || "");
    setStartDate(node.startDate ? new Date(node.startDate).toISOString().split('T')[0] : "");
    setEndDate(node.endDate ? new Date(node.endDate).toISOString().split('T')[0] : "");
    setContent((node.content as Record<string, unknown>) || {});
    setSprintId(node.sprintId || null);
    setStatus(node.status || "TODO");
    lastNodeIdRef.current = node.id;
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
  }, [node.id]);

  // Debounced auto-save effect
  useEffect(() => {
    if (isInitialMount.current) { 
      isInitialMount.current = false; 
      return; 
    }

    // Skip saving if we are just loading a newly clicked node
    if (lastNodeIdRef.current !== node.id) {
      lastNodeIdRef.current = node.id;
      return;
    }

    // Only save if a field was actually modified by the user
    const originalStartDate = node.startDate ? new Date(node.startDate).toISOString().split('T')[0] : "";
    const originalEndDate = node.endDate ? new Date(node.endDate).toISOString().split('T')[0] : "";
    const isUnchanged = 
      title === (node.title || "") &&
      description === (node.description || "") &&
      startDate === originalStartDate &&
      endDate === originalEndDate &&
      JSON.stringify(content) === JSON.stringify(node.content || {});

    if (isUnchanged) return;

    setSavingStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNode(projectId, node.id, { title, description, content, startDate: startDate || null, endDate: endDate || null });
        setSavingStatus('saved'); 
        setTimeout(() => setSavingStatus('idle'), 2000);
      } catch { 
        setSavingStatus('idle'); 
      }
    }, 500);

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [title, description, content, startDate, endDate, projectId, node]);

  useEffect(() => {
    if (activeTab === 'history' && node?.id) loadHistoryData(projectId, node.id, setHistory);
  }, [activeTab, node?.id, projectId]);

  if (!node) return null;

  return (
    <div className="side-panel-container card-planner p-none">
      <header className="side-panel-header">
        <div className="flex items-center gap-md">
          <div className="side-panel-icon-container" style={{ '--node-color': node.type?.color || 'var(--primary)' } as React.CSSProperties}><IconRenderer name={node.type?.icon || 'Target'} size={18} /></div>
          <div className="flex flex-col">
            <div className="flex items-center gap-sm"><span className="text-meta">{node.type?.name}</span>{node.isArchived && <span className="badge-archived">ARCHIVED</span>}</div>
            <div className="saving-status-text">
                {savingStatus === 'saving' && 'AUTOSAVING...'}
                {savingStatus === 'saved' && 'SAVED'}
                {savingStatus === 'idle' && 'SYNCED'}
            </div>
          </div>
        </div>
        <Button variant="ghost" onClick={onClose} size="sm"><X size={20} /></Button>
      </header>
 
      <div className="side-panel-tabs-wrapper border-b">
        <SegmentedControl options={[{ id: 'details', label: 'DETAILS' }, { id: 'history', label: 'HISTORY', icon: <Clock size={14} /> }]} value={activeTab} onChange={(id) => setActiveTab(id as 'details' | 'history')} />
      </div>

      <div ref={scrollAreaRef} className="side-panel-scroll-area flex-1 overflow-y-auto">
        {activeTab === 'details' ? (
          <NodeDetailsTab node={node} title={title} setTitle={setTitle} description={description} setDescription={setDescription} status={status} setStatus={setStatus} sprintId={sprintId} setSprintId={setSprintId} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} content={content} setContent={setContent} sprints={sprints} allNodes={allNodes} projectId={projectId} />
        ) : (
          <AuditTrail history={history} />
        )}
      </div>

      <footer className="side-panel-footer border-t">
        <Button variant="secondary" onClick={async () => { await archiveNode(projectId, node.id, !node.isArchived); onClose(); }} className="w-full" icon={node.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}>
          {node.isArchived ? "Restore Node" : "Archive Node"}
        </Button>
      </footer>
    </div>
  );
}

async function loadHistoryData(projectId: string, nodeId: string, setHistory: (data: AuditLogEvent[]) => void) {
  const data = await getHistoryForNode(projectId, nodeId);
  setHistory(data);
}
