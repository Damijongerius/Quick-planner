"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, FileJson, FileSpreadsheet, LayoutTemplate, Trash2 } from "lucide-react";
import { deleteTemplate, saveProjectAsTemplate } from "@/lib/actions";
import type { TemplateInfo } from "@/lib/importer/templates";
import { useProject } from "../ProjectContext";
import { PageHeader } from "../PageHeader";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Input } from "../ui/Input";
import { ImportWizard } from "./ImportWizard";

interface Props {
  readonly projectId: string;
  readonly people: { email: string | null; name: string | null }[];
  readonly existingTypes: string[];
  readonly myTemplates: TemplateInfo[];
}

function Card({ title, hint, children }: Readonly<{ title: string; hint?: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-lg border border-border bg-panel p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function DataPanel({ projectId, people, existingTypes, myTemplates }: Props) {
  const { isReadOnly, project } = useProject();
  const router = useRouter();
  const [name, setName] = useState(`${project.name} template`.slice(0, 120));
  const [description, setDescription] = useState("");
  const [withItems, setWithItems] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMessage(null);
    const result = await saveProjectAsTemplate(projectId, name, description, withItems);
    setBusy(false);
    if (result.error) { setMessage({ kind: "error", text: result.error }); return; }
    setMessage({ kind: "ok", text: `Saved “${name}”. Pick it when you create a new project.` });
    router.refresh();
  };

  const remove = async (t: TemplateInfo) => {
    if (!confirm(`Delete the template “${t.name}”? Projects made from it are not affected.`)) return;
    await deleteTemplate(t.id);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader title="Import & export" description="Bring work in from another tool, take it with you, or reuse this project's structure." />

      <Card title="Export" hint="Everything stays yours. JSON contains the whole project and can be imported again; CSV opens in any spreadsheet.">
        <div className="flex flex-wrap gap-3">
          <a className="button-base button-secondary button-md no-underline" href={`/api/projects/${projectId}/export?format=json`} download><FileJson size={15} /> Download JSON <span className="text-xs text-muted">(whole project)</span></a>
          <a className="button-base button-secondary button-md no-underline" href={`/api/projects/${projectId}/export?format=csv`} download><FileSpreadsheet size={15} /> Download CSV <span className="text-xs text-muted">(items)</span></a>
        </div>
      </Card>

      <Card title="Import" hint="Add items from Jira, Linear, Asana, Trello or any CSV. You see a preview and choose how statuses and types map before anything is created.">
        {isReadOnly ? <p className="text-sm text-muted">You have view-only access, so you can&apos;t import into this project.</p> : <ImportWizard projectId={projectId} people={people} existingTypes={existingTypes} />}
      </Card>

      <Card title="Save as template" hint="Keep this project's item types, fields and rules so a new project can start from them. Templates are private to you.">
        <form onSubmit={save} className="flex max-w-lg flex-col gap-3">
          <div><label htmlFor="template-name" className="form-field-label">Template name</label><Input id="template-name" className="mt-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required /></div>
          <div><label htmlFor="template-desc" className="form-field-label">Description</label><Input id="template-desc" className="mt-1" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="Optional" /></div>
          <Checkbox checked={withItems} onChange={(e) => setWithItems(e.target.checked)} label="Also keep the items (titles and structure only, up to 300)" />
          {message && <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-danger" : "text-success"}`}>{message.text}</p>}
          <div><Button type="submit" loading={busy} icon={<LayoutTemplate size={14} />}>Save template</Button></div>
        </form>
        {myTemplates.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-2 text-sm font-medium">Your templates</h3>
            <ul className="divide-y divide-border rounded-md border border-border">
              {myTemplates.map((t) => (
                <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium">{t.name}</span><span className="block truncate text-xs text-muted">{t.summary}</span></span>
                  <button type="button" className="icon-button hover:!text-danger" aria-label={`Delete template ${t.name}`} onClick={() => remove(t)}><Trash2 size={14} /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
      <p className="flex items-center gap-1.5 text-xs text-faint"><Download size={12} /> Exports include every item, including archived ones.</p>
    </div>
  );
}
