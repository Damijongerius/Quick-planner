"use client";

import { useState } from "react";
import { Archive, ArchiveRestore, Trash2, X } from "lucide-react";
import { bulkDeleteNodes, bulkUpdateNodes, restoreNodes, undoDelete } from "@/lib/actions";
import type { BulkPatch } from "@/lib/actions/bulk";
import { STATUS_OPTIONS } from "@/lib/statusMeta";
import { Select } from "../ui/Select";
import { useToast } from "../ui/Toast";
import { useProject } from "../ProjectContext";
import { Sprint } from "@/lib/types";

interface BulkBarProps {
  readonly projectId: string;
  readonly ids: string[];
  readonly sprints: Sprint[];
  readonly showingArchived: boolean;
  readonly onClear: () => void;
  readonly onChanged: () => void;
}

/** Appears while items are selected: change status, assignee or sprint for all of them, archive or delete. Everything can be undone. */
export function BulkBar({ projectId, ids, sprints, showingArchived, onClear, onChanged }: BulkBarProps) {
  const { members } = useProject();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const noun = `${ids.length} item${ids.length === 1 ? "" : "s"}`;

  const apply = async (patch: BulkPatch, message: string) => {
    setBusy(true);
    const result = await bulkUpdateNodes(projectId, ids, patch);
    setBusy(false);
    if (result.error) {
      toast({ kind: "error", message: result.error });
      return;
    }
    const previous = result.previous ?? [];
    toast({
      kind: "success",
      message,
      action: { label: "Undo", onClick: async () => { await restoreNodes(projectId, previous); onChanged(); } },
    });
    onClear();
    onChanged();
  };

  const remove = async () => {
    if (!confirm(`Delete ${noun}? Their comments go too. You can undo this for a few minutes.`)) return;
    setBusy(true);
    const result = await bulkDeleteNodes(projectId, ids);
    setBusy(false);
    if (result.error) {
      toast({ kind: "error", message: result.error });
      return;
    }
    const undoId = result.undoId;
    toast({
      kind: "success",
      message: `Deleted ${noun}`,
      durationMs: 10_000,
      action: undoId ? { label: "Undo", onClick: async () => { const r = await undoDelete(projectId, undoId); if (r.error) toast({ kind: "error", message: r.error }); onChanged(); } } : undefined,
    });
    onClear();
    onChanged();
  };

  return (
    <div role="toolbar" aria-label="Bulk actions" className="fixed bottom-6 left-1/2 z-[120] flex max-w-[calc(100vw-1.5rem)] -translate-x-1/2 flex-wrap items-center gap-2 rounded-xl border border-border-strong bg-panel px-3 py-2 shadow-lg animate-pop-in">
      <span className="px-1 text-sm font-medium">{ids.length} selected</span>
      <div className="h-5 w-px bg-border" />
      <div style={{ width: 140 }}>
        <Select
          options={STATUS_OPTIONS}
          value=""
          placeholder="Set status…"
          disabled={busy}
          onChange={(v) => apply({ status: v }, `Moved ${noun} to ${STATUS_OPTIONS.find((o) => o.value === v)?.label}`)}
        />
      </div>
      <div style={{ width: 150 }}>
        <Select
          options={[{ value: "none", label: "Unassigned" }, ...members.map((m) => ({ value: m.id, label: m.isYou ? `${m.name || m.email} (you)` : (m.name || m.email || "Member") }))]}
          value=""
          placeholder="Assign to…"
          disabled={busy}
          onChange={(v) => apply({ assigneeId: v === "none" ? null : v }, v === "none" ? `Unassigned ${noun}` : `Assigned ${noun}`)}
        />
      </div>
      <div style={{ width: 150 }}>
        <Select
          options={[{ value: "none", label: "Backlog" }, ...sprints.filter((s) => s.status !== "COMPLETED").map((s) => ({ value: s.id, label: s.name }))]}
          value=""
          placeholder="Move to sprint…"
          disabled={busy}
          onChange={(v) => apply({ sprintId: v === "none" ? null : v }, `Moved ${noun} to ${v === "none" ? "the backlog" : sprints.find((s) => s.id === v)?.name}`)}
        />
      </div>
      <button className="icon-button" disabled={busy} onClick={() => apply({ isArchived: !showingArchived }, showingArchived ? `Restored ${noun}` : `Archived ${noun}`)} aria-label={showingArchived ? "Restore selected" : "Archive selected"} title={showingArchived ? "Restore" : "Archive"}>
        {showingArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
      </button>
      <button className="icon-button hover:!text-danger" disabled={busy} onClick={remove} aria-label="Delete selected" title="Delete"><Trash2 size={16} /></button>
      <button className="icon-button" onClick={onClear} aria-label="Clear selection" title="Clear selection"><X size={16} /></button>
    </div>
  );
}
