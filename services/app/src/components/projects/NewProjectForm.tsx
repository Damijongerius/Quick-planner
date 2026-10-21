"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { createProject, listTemplates } from "@/lib/actions";
import type { TemplateInfo } from "@/lib/importer/templates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function NewProjectForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [template, setTemplate] = useState("builtin:software");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open && templates.length === 0) void listTemplates().then(setTemplates).catch(() => {});
  }, [open, templates.length]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const project = await createProject(name, template);
      router.push(`/project/${(project as { id: string }).id}/board`);
    } catch {
      setError("Couldn't create the project. Try a shorter name.");
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex min-h-[148px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong text-sm text-muted transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-hover"><Plus size={18} /></span>
        New project
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="flex min-h-[148px] flex-col gap-3 rounded-lg border border-accent/50 bg-panel p-4 shadow-md animate-fade-in">
      <Input autoFocus placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required aria-label="Project name" />
      <div>
        <label htmlFor="new-project-template" className="form-field-label">Start from</label>
        <select id="new-project-template" className="input-planner mt-1" value={template} onChange={(e) => setTemplate(e.target.value)}>
          {templates.length === 0 && <option value="builtin:software">Software sprint</option>}
          {templates.filter((t) => t.builtIn).map((t) => <option key={t.id} value={t.id}>{t.name} — {t.summary}</option>)}
          {templates.some((t) => !t.builtIn) && <optgroup label="Your templates">{templates.filter((t) => !t.builtIn).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</optgroup>}
        </select>
      </div>
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      <div className="mt-auto flex gap-2">
        <Button type="submit" size="sm" loading={saving}>Create</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
      <Link href="/projects/import" className="text-xs text-muted underline hover:text-fg">Import from Jira, Trello, CSV…</Link>
    </form>
  );
}
