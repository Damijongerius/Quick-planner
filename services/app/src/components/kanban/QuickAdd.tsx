"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";

export interface QuickAddType { id: string; name: string }

/** "+ Add" at the bottom of a column: type a title, press Enter, and the card appears; Enter again for the next one. */
export function QuickAdd({ types, onAdd }: Readonly<{ types: QuickAddType[]; onAdd: (title: string, typeId: string) => Promise<void> }>) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (types.length === 0) return null;

  const activeType = types.find((t) => t.id === typeId) ?? types[0];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    setError("");
    try {
      await onAdd(title, activeType.id);
      setTitle("");
    } catch {
      setError("Couldn't add that item.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="flex h-8 w-full items-center gap-1.5 rounded-md px-2 text-sm text-faint transition-colors hover:bg-hover hover:text-fg" data-quick-add>
        <Plus size={14} /> Add item
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-1.5 rounded-md border border-border bg-panel p-2 shadow-sm">
      <input
        autoFocus
        className="input-planner"
        placeholder={`New ${activeType.name.toLowerCase()} title…`}
        aria-label="New item title"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setTitle(""); } }}
      />
      <div className="flex items-center gap-1.5">
        {types.length > 1 && (
          <select aria-label="Item type" className="input-planner !h-7 !w-auto flex-1 text-xs" value={activeType.id} onChange={(e) => setTypeId(e.target.value)}>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        )}
        <button type="submit" disabled={busy || !title.trim()} className="button-base button-primary button-sm ml-auto">Add</button>
        <button type="button" onClick={() => { setOpen(false); setTitle(""); }} className="button-base button-ghost button-sm">Done</button>
      </div>
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
    </form>
  );
}
