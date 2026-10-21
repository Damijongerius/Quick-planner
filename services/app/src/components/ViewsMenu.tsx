"use client";

import { useCallback, useEffect, useState } from "react";
import { Bookmark, Check, Trash2, Users } from "lucide-react";
import { createSavedView, deleteSavedView, getSavedViews } from "@/lib/actions";
import type { ViewInfo } from "@/lib/actions/views";
import { APPLY_VIEW_EVENT, pickViewQuery, sameQuery, type ViewPage } from "@/lib/urlState";
import { useProject } from "./ProjectContext";
import { Button } from "./ui/Button";
import { useDismiss } from "./ui/useDismiss";

/** Saved filter sets for a page: personal ones, and ones shared with the team. */
export function ViewsMenu({ page }: Readonly<{ page: ViewPage }>) {
  const { project, role } = useProject();
  const [open, setOpen] = useState(false);
  const [views, setViews] = useState<ViewInfo[]>([]);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [shared, setShared] = useState(false);
  const [error, setError] = useState("");
  const [current, setCurrent] = useState("");
  const ref = useDismiss(open, () => { setOpen(false); setSaving(false); });

  const load = useCallback(async () => setViews(await getSavedViews(project.id, page)), [project.id, page]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(pickViewQuery(window.location.search, page));
    void load();
  }, [open, load, page]);

  const apply = (query: string) => {
    window.dispatchEvent(new CustomEvent(APPLY_VIEW_EVENT, { detail: query }));
    setOpen(false);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const result = await createSavedView(project.id, { name, page, query: window.location.search, shared });
    if (result.error) { setError(result.error); return; }
    setName(""); setShared(false); setSaving(false);
    await load();
  };

  const remove = async (view: ViewInfo) => {
    if (!confirm(`Delete the view “${view.name}”?`)) return;
    const result = await deleteSavedView(project.id, view.id);
    if (result.error) alert(result.error);
    await load();
  };

  return (
    <div ref={ref} className="relative">
      <Button variant="secondary" onClick={() => setOpen(!open)} icon={<Bookmark size={14} />} aria-haspopup="menu" aria-expanded={open}>Views</Button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 w-72 animate-pop-in rounded-lg border border-border bg-panel p-1 shadow-lg">
          <button role="menuitem" onClick={() => apply("")} className="flex h-8 w-full items-center rounded-md px-2.5 text-left text-sm hover:bg-hover">Default view</button>
          {views.length > 0 && <div className="my-1 h-px bg-border" />}
          {views.map((v) => (
            <div key={v.id} className="group flex items-center rounded-md hover:bg-hover">
              <button role="menuitem" onClick={() => apply(v.query)} className="flex h-8 min-w-0 flex-1 items-center gap-2 px-2.5 text-left text-sm">
                <span className="flex h-4 w-4 items-center justify-center text-accent">{sameQuery(v.query, current) && <Check size={14} />}</span>
                <span className="truncate">{v.name}</span>
                {v.shared && <span title={`Shared by ${v.ownerName}`} className="ml-auto text-faint"><Users size={12} /></span>}
              </button>
              {(v.mine || role === "OWNER") && (
                <button onClick={() => remove(v)} aria-label={`Delete view ${v.name}`} className="mr-1 flex h-6 w-6 items-center justify-center rounded text-faint opacity-0 hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"><Trash2 size={13} /></button>
              )}
            </div>
          ))}
          <div className="my-1 h-px bg-border" />
          {saving ? (
            <form onSubmit={save} className="flex flex-col gap-2 p-2">
              <input autoFocus className="input-planner" placeholder="Name this view" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required aria-label="View name" />
              {role !== "VIEWER" && (
                <label className="flex items-center gap-2 text-sm text-muted"><input type="checkbox" className="checkbox-premium" checked={shared} onChange={(e) => setShared(e.target.checked)} /> Share with the team</label>
              )}
              {error && <p className="text-xs text-danger" role="alert">{error}</p>}
              <div className="flex gap-2"><Button type="submit" size="sm">Save view</Button><Button type="button" size="sm" variant="ghost" onClick={() => setSaving(false)}>Cancel</Button></div>
            </form>
          ) : (
            <button role="menuitem" onClick={() => { setSaving(true); setError(""); }} className="flex h-8 w-full items-center rounded-md px-2.5 text-left text-sm text-accent hover:bg-hover">Save current filters as a view…</button>
          )}
        </div>
      )}
    </div>
  );
}
