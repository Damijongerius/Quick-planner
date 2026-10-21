"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Archive, ArchiveRestore, MessageSquare, Trash2, Bell, BellOff } from "lucide-react";
import { updateNode, getNode, archiveNode, deleteNode, undoDelete, isWatching, setWatching, markNodeNotificationsRead } from "@/lib/actions";
import { useToast } from "./ui/Toast";
import { useRealtime, NOTIFICATIONS_CHANGED } from "./realtime/RealtimeProvider";
import { PeerBadges } from "./realtime/PeerBadges";
import { Avatar } from "./ui/Avatar";
import { dirtyKeys, mergeRemote, type Conflict, type Fields } from "@/lib/mergeRemote";
import { ActivityTab } from "./ActivityTab";
import { IconRenderer } from "./IconPicker";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { SegmentedControl } from "./ui/SegmentedControl";
import { NodeDetailsTab } from "./NodeDetailsTab";

import { useProject } from "./ProjectContext";
import { Node, Sprint, NodeType } from "@/lib/types";

export function NodeSidePanel({ 
  projectId, 
  node, 
  onClose, 
  sprints, 
  allNodes,
  nodeTypes,
  onNodeUpdated
}: Readonly<{ 
  projectId: string; 
  node: Node; 
  isOpen?: boolean; 
  onClose: () => void; 
  sprints: Sprint[]; 
  allNodes: Node[];
  nodeTypes: NodeType[];
  onNodeUpdated?: () => void;
}>) {
  const { isReadOnly, isArchived, members, currentUserId } = useProject();
  const { setPresence, subscribe, peersFor } = useRealtime();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [title, setTitle] = useState(node.title || "");
  const [description, setDescription] = useState(node.description || "");
  const [startDate, setStartDate] = useState(toDay(node.startDate));
  const [endDate, setEndDate] = useState(toDay(node.endDate));
  const [content, setContent] = useState<Record<string, unknown>>((node.content as Record<string, unknown>) || {});
  const [sprintId, setSprintId] = useState<string | null>(node.sprintId || null);
  const [assigneeId, setAssigneeId] = useState<string | null>(node.assigneeId || null);
  const [commentCount, setCommentCount] = useState(node._count?.comments ?? 0);
  const [saveError, setSaveError] = useState("");
  const [status, setStatus] = useState(node.status || "TODO");
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [watching, setWatchingState] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [loadedFor, setLoadedFor] = useState(node.id);
  const [conflicts, setConflicts] = useState<(Conflict & { by: string })[]>([]);
  const [removedBy, setRemoteRemoved] = useState<string | null>(null);

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Latest not-yet-sent save, so it can be flushed when the panel closes instead of being dropped.
  const pendingSaveRef = useRef<(() => Promise<void>) | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  // What the server last told us (or what we last saved): "unchanged" means equal to this.
  const baselineRef = useRef<Fields>(nodeToFields(node));
  const latestRef = useRef<Fields>(nodeToFields(node));
  // Async handlers (remote merge) read the form through this ref; keep it in step after each render.
  useEffect(() => { latestRef.current = { title, description, startDate, endDate, content }; });
  const editingRef = useRef(false);
  const editTimer = useRef<NodeJS.Timeout | null>(null);

  const nameOf = (userId: string) => {
    const m = members.find((x) => x.id === userId.replace(/^api:/, ""));
    return m ? (m.name || m.email || "A teammate") : "A teammate";
  };

  // Reset local states when a different node is selected
  useEffect(() => {
    baselineRef.current = nodeToFields(node);
    setTitle(node.title || "");
    setDescription(node.description || "");
    setStartDate(toDay(node.startDate));
    setEndDate(toDay(node.endDate));
    setContent((node.content as Record<string, unknown>) || {});
    setSprintId(node.sprintId || null);
    setAssigneeId(node.assigneeId || null);
    setStatus(node.status || "TODO");
    setCommentCount(node._count?.comments ?? 0);
    setConflicts([]);
    setRemoteRemoved(null);
    setLoadedFor(node.id);
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.id]);

  // Tell teammates which item I have open, and clear it when I leave.
  useEffect(() => {
    setPresence({ viewing: node.id, editing: null });
    return () => setPresence({ viewing: null, editing: null });
  }, [node.id, setPresence]);

  const setEditing = useCallback((on: boolean) => {
    if (editTimer.current) { clearTimeout(editTimer.current); editTimer.current = null; }
    if (on) {
      if (!editingRef.current) { editingRef.current = true; setPresence({ editing: node.id }); }
    } else if (editingRef.current) {
      // linger briefly so "Sam is editing" doesn't flicker between keystrokes
      editTimer.current = setTimeout(() => { editingRef.current = false; setPresence({ editing: null }); }, 2500);
    }
  }, [node.id, setPresence]);

  // Debounced auto-save. Only fields that differ from the baseline count as edits.
  useEffect(() => {
    if (isReadOnly || loadedFor !== node.id) return;
    const fields: Fields = { title, description, startDate, endDate, content };
    if (dirtyKeys(baselineRef.current, fields).length === 0) {
      pendingSaveRef.current = null;
      setEditing(false);
      return;
    }
    setEditing(true);
    // A teammate changed something I'm also editing: hold my save until I choose, never overwrite silently.
    if (conflicts.length > 0) {
      setSavingStatus('idle'); // paused on purpose; the conflict card explains why
      return;
    }

    setSavingStatus('saving');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    const save = async () => {
      pendingSaveRef.current = null;
      try {
        const result = await updateNode(projectId, node.id, { title, description, content, startDate: startDate || null, endDate: endDate || null });
        if (result?.error) {
          setSaveError(result.error);
          setSavingStatus('error');
          return;
        }
        baselineRef.current = fields;
        setSaveError("");
        setSavingStatus('saved'); 
        onNodeUpdated?.();
        setTimeout(() => setSavingStatus('idle'), 2000);
      } catch (error) { 
        console.error("Autosave failed", error);
        setSaveError("");
        setSavingStatus('error');
      }
    };
    pendingSaveRef.current = save;
    saveTimeoutRef.current = setTimeout(save, 500);

    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [title, description, content, startDate, endDate, projectId, node.id, loadedFor, conflicts, isReadOnly, setEditing, onNodeUpdated]);

  // A teammate changed this item: merge their change into what I'm looking at.
  useEffect(() => subscribe((event) => {
    if (event.nodeId !== node.id && !event.resync) return;
    if (event.scope === "comments") {
      // New/removed comment: keep the tab's count right even while another tab is showing.
      void getNode(projectId, node.id).then((n) => { if (n) setCommentCount(n._count?.comments ?? 0); }).catch(() => {});
      return;
    }
    if (event.by === currentUserId) return;
    void (async () => {
      let fresh: Node | null = null;
      try { fresh = await getNode(projectId, node.id); } catch { return; }
      if (!fresh) { setRemoteRemoved(event.by); return; }

      const merged = mergeRemote(baselineRef.current, latestRef.current, nodeToFields(fresh));
      baselineRef.current = merged.baseline;
      const l = merged.local;
      setTitle(l.title); setDescription(l.description); setStartDate(l.startDate); setEndDate(l.endDate); setContent(l.content);
      setConflicts((prev) => [
        ...prev.filter((c) => !merged.conflicts.some((n) => n.key === c.key)),
        ...merged.conflicts.map((c) => ({ ...c, by: event.by })),
      ]);
      // These save the moment they change, so there is never a local draft to protect.
      setStatus(fresh.status || "TODO");
      setSprintId(fresh.sprintId || null);
      setAssigneeId(fresh.assigneeId || null);
      if (fresh.isArchived !== node.isArchived) onNodeUpdated?.();
    })();
  }), [subscribe, currentUserId, projectId, node.id, node.isArchived, onNodeUpdated]);

  const resolveConflict = (key: string, choice: "mine" | "theirs") => {
    const conflict = conflicts.find((c) => c.key === key);
    if (!conflict) return;
    if (choice === "theirs") {
      if (key.startsWith("content:")) setContent((prev) => ({ ...prev, [key.slice(8)]: conflict.theirs }));
      else if (key === "title") setTitle(conflict.theirs);
      else if (key === "description") setDescription(conflict.theirs);
      else if (key === "startDate") setStartDate(conflict.theirs);
      else if (key === "endDate") setEndDate(conflict.theirs);
    }
    setConflicts((prev) => prev.filter((c) => c.key !== key));
  };

  // Closing the panel (or switching nodes) within the debounce window must not drop the edit.
  useEffect(() => () => {
    if (pendingSaveRef.current) void pendingSaveRef.current();
    if (editTimer.current) clearTimeout(editTimer.current);
  }, []);

  // Whether I follow this item; opening it also clears its notifications.
  useEffect(() => {
    let cancelled = false;
    void isWatching(projectId, node.id).then((w) => { if (!cancelled) setWatchingState(w); }).catch(() => {});
    void markNodeNotificationsRead(projectId, node.id).then(() => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED))).catch(() => {});
    return () => { cancelled = true; };
  }, [projectId, node.id]);

  const toggleWatching = async () => {
    const next = !watching;
    setWatchingState(next);
    try {
      await setWatching(projectId, node.id, next);
      toast({ message: next ? "You’ll be notified about changes to this item" : "You’ve stopped following this item" });
    } catch { setWatchingState(!next); }
  };

  if (!node) return null;

  const typeColor = node.type?.color || "var(--accent)";
  const doArchiveToggle = async () => {
    try {
      if (node.isArchived) {
        await archiveNode(projectId, node.id, false);
        toast({ message: `Restored “${node.title}”`, action: { label: "Undo", onClick: async () => { await archiveNode(projectId, node.id, true); onNodeUpdated?.(); } } });
        onNodeUpdated?.();
        onClose();
      } else if (getRecursiveActiveChildren(node.id, allNodes).length > 0) {
        setIsArchiveConfirmOpen(true);
      } else {
        await archiveNode(projectId, node.id, true);
        toast({ message: `Archived “${node.title}”`, action: { label: "Undo", onClick: async () => { await archiveNode(projectId, node.id, false); onNodeUpdated?.(); } } });
        onNodeUpdated?.();
        onClose();
      }
    } catch (error) {
      console.error("Archive failed", error);
      alert("Could not update this item.");
    }
  };

  const doDelete = async () => {
    if (!confirm(`Delete “${node.title}”? Its comments are removed too and child items become top-level. You can undo this for a few minutes.`)) return;
    try {
      const { undoId } = await deleteNode(projectId, node.id);
      toast({
        message: `Deleted “${node.title}”`,
        durationMs: 10_000,
        action: undoId ? { label: "Undo", onClick: async () => { const r = await undoDelete(projectId, undoId); if (r.error) toast({ kind: "error", message: r.error }); onNodeUpdated?.(); } } : undefined,
      });
      onNodeUpdated?.();
      onClose();
    } catch (error) {
      console.error("Delete failed", error);
      alert("Could not delete this item.");
    }
  };

  const archiveWith = (withChildren: boolean) => async () => {
    setIsArchiving(true);
    try {
      await archiveNode(projectId, node.id, true, withChildren);
      onNodeUpdated?.();
      setIsArchiveConfirmOpen(false);
      onClose();
    } catch (error) {
      console.error("Archive failed", error);
      alert("Could not archive this item.");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="flex h-full max-h-[inherit] flex-col overflow-hidden rounded-lg border border-border bg-panel shadow-md">
      <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md"
          style={{ color: typeColor, background: `color-mix(in srgb, ${typeColor} 14%, transparent)` }}
        >
          <IconRenderer name={node.type?.icon || "Target"} size={14} />
        </span>
        <span className="text-sm font-medium">{node.type?.name}</span>
        {node.isArchived && <span className="badge-archived">Archived</span>}
        <PeerBadges nodeId={node.id} max={3} />
        <span className="ml-auto text-xs text-faint" aria-live="polite">
          {savingStatus === "saving" && "Saving…"}
          {savingStatus === "saved" && "Saved"}
          {savingStatus === "error" && <span className="text-danger" title={saveError}>{saveError || "Couldn’t save. Check your connection."}</span>}
        </span>
        <button onClick={toggleWatching} className="icon-button" aria-pressed={watching} aria-label={watching ? "Stop following this item" : "Follow this item"} title={watching ? "Following — click to stop" : "Follow to get notified"}>
          {watching ? <Bell size={15} className="text-accent" /> : <BellOff size={15} />}
        </button>
        <button onClick={onClose} className="icon-button" aria-label="Close panel"><X size={16} /></button>
      </header>

      <div className="border-b border-border px-4 py-2">
        <SegmentedControl
          layoutId="side-panel-tabs"
          options={[
            { id: "details", label: "Details" },
            { id: "activity", label: commentCount > 0 ? `Activity · ${commentCount}` : "Activity", icon: <MessageSquare size={13} /> },
          ]}
          value={activeTab}
          onChange={(id) => setActiveTab(id as "details" | "activity")}
        />
      </div>

      <div ref={scrollAreaRef} className="flex-1 overflow-y-auto p-4">
        {removedBy && (
          <div role="alert" className="mb-4 rounded-md border border-danger/30 bg-danger-soft p-3 text-sm text-danger">
            <strong>{nameOf(removedBy)}</strong> deleted this item. Close the panel to continue.
          </div>
        )}
        {!removedBy && peersFor(node.id).some((p) => p.editing === node.id) && (
          <div role="status" className="mb-4 flex items-center gap-2 rounded-md border border-border bg-hover px-3 py-2 text-sm text-muted">
            {peersFor(node.id).filter((p) => p.editing === node.id).map((p) => <Avatar key={p.userId} src={p.image} name={p.name} size="xs" />)}
            {peersFor(node.id).filter((p) => p.editing === node.id).map((p) => p.name ?? "Someone").join(", ")} {peersFor(node.id).filter((p) => p.editing === node.id).length > 1 ? "are" : "is"} editing this item right now.
          </div>
        )}
        {conflicts.length > 0 && (
          <div role="alert" className="mb-4 flex flex-col gap-3 rounded-md border border-warning/40 bg-warning-soft p-3 text-sm">
            <p className="font-medium text-warning">Someone changed what you&apos;re editing</p>
            <p className="text-xs text-muted">Your changes are paused until you choose, so nothing is overwritten.</p>
            {conflicts.map((c) => (
              <div key={c.key} className="rounded-md bg-panel p-2.5">
                <p className="text-xs text-muted"><strong className="text-fg">{nameOf(c.by)}</strong> changed <strong className="text-fg">{c.label}</strong></p>
                <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-xs"><span className="text-faint">Theirs: </span>{c.theirs || "(empty)"}</p>
                <p className="mt-0.5 line-clamp-3 whitespace-pre-wrap break-words text-xs"><span className="text-faint">Yours: </span>{c.mine || "(empty)"}</p>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => resolveConflict(c.key, "theirs")}>Use theirs</Button>
                  <Button size="sm" onClick={() => resolveConflict(c.key, "mine")}>Keep mine</Button>
                </div>
              </div>
            ))}
          </div>
        )}
        {activeTab === "details" ? (
          <NodeDetailsTab node={node} nodeTypes={nodeTypes} title={title} setTitle={setTitle} description={description} setDescription={setDescription} status={status} setStatus={setStatus} sprintId={sprintId} setSprintId={setSprintId} assigneeId={assigneeId} setAssigneeId={setAssigneeId} startDate={startDate} setStartDate={setStartDate} endDate={endDate} setEndDate={setEndDate} content={content} setContent={setContent} sprints={sprints} allNodes={allNodes} projectId={projectId} onNodeUpdated={onNodeUpdated} isReadOnly={isReadOnly} />
        ) : (
          <ActivityTab projectId={projectId} nodeId={node.id} canComment={!isArchived} onCountChange={setCommentCount} />
        )}
      </div>

      {!isReadOnly && (
        <footer className="flex items-center justify-between border-t border-border px-4 py-2.5">
          <Button variant="ghost" size="sm" onClick={doArchiveToggle} icon={node.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}>
            {node.isArchived ? "Restore item" : "Archive item"}
          </Button>
          <Button variant="ghost" size="sm" className="hover:!text-danger" onClick={doDelete} icon={<Trash2 size={14} />}>Delete</Button>
        </footer>
      )}

      <Modal
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        title="Archive child items too?"
        subtitle="This item has active children."
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setIsArchiveConfirmOpen(false)} disabled={isArchiving}>Cancel</Button>
            <Button variant="secondary" loading={isArchiving} onClick={archiveWith(false)}>Archive item only</Button>
            <Button variant="danger" loading={isArchiving} onClick={archiveWith(true)}>Archive all</Button>
          </div>
        }
      >
        <p className="text-sm leading-relaxed text-muted">
          Children can be archived along with this item, or stay active — they will then appear in the backlog without this parent.
        </p>
      </Modal>
    </div>
  );
}

function toDay(value: string | Date | null | undefined): string {
  return value ? new Date(value).toISOString().split('T')[0] : "";
}

function nodeToFields(n: Node): Fields {
  return {
    title: n.title || "",
    description: n.description || "",
    startDate: toDay(n.startDate),
    endDate: toDay(n.endDate),
    content: (n.content as Record<string, unknown>) || {},
  };
}

function getRecursiveActiveChildren(nodeId: string, nodesList: Node[]): Node[] {
  if (!nodesList) return [];
  // Index children by parent once, then walk iteratively with a visited set (safe against cycles).
  const childrenByParent = new Map<string, Node[]>();
  for (const n of nodesList) {
    if (n.isArchived) continue;
    for (const pl of n.parentLinks ?? []) {
      const parentId = pl.parentNode?.id;
      if (!parentId) continue;
      const siblings = childrenByParent.get(parentId);
      if (siblings) siblings.push(n);
      else childrenByParent.set(parentId, [n]);
    }
  }

  const visited = new Set<string>([nodeId]);
  const descendants: Node[] = [];
  const queue = [nodeId];
  while (queue.length > 0) {
    for (const child of childrenByParent.get(queue.shift() as string) ?? []) {
      if (visited.has(child.id)) continue;
      visited.add(child.id);
      descendants.push(child);
      queue.push(child.id);
    }
  }
  return descendants;
}

