"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronDown, FileUp, Upload } from "lucide-react";
import { importAsNewProject, importItems, type ImportResult } from "@/lib/actions";
import { buildFromCsv, CSV_FIELD_LABELS, readImportFile, type ColumnMapping, type CsvField, type ReadResult } from "@/lib/importer/formats";
import { assigneeChoices, buildPlan, describePlan, matchPerson, statusChoices, typeChoices } from "@/lib/importer/plan";
import { IMPORT_LIMITS, type ItemStatus, type ParsedImport } from "@/lib/importer/types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { STATUS_OPTIONS } from "@/lib/statusMeta";

const SOURCE_NAME: Record<string, string> = { jira: "Jira (CSV)", linear: "Linear (CSV)", asana: "Asana (CSV)", trello: "Trello (JSON)", "quick-planner": "Quick Planner export", csv: "CSV file" };
const FIELD_ORDER: CsvField[] = ["title", "ref", "description", "type", "status", "parent", "assignee", "sprint", "startDate", "endDate", "completedAt", "blockedBy"];

interface Person { email: string | null; name: string | null }
interface Props {
  /** null = create a new project from the file */
  readonly projectId: string | null;
  readonly people: Person[];
  readonly existingTypes: string[];
}

const HOW_TO: [string, string][] = [
  ["Jira", "Filter your issues, then Export → Export CSV (all fields). Parents, sprints, story points and “blocks” links come along."],
  ["Linear", "Settings → Import / Export → Export CSV. Cycles become sprints and estimates become story points."],
  ["Trello", "Board menu → Print and export → Export as JSON. Lists become statuses and checklist items become subtasks."],
  ["Asana", "Project menu → Export / Print → CSV. Subtasks and dependencies are matched by name."],
  ["Quick Planner", "Import & export → Export JSON brings the whole project, including item types, sprints and milestones."],
  ["Anything else", "A CSV with a header row works. You choose which column is which in the next step."],
];

export function ImportWizard({ projectId, people, existingTypes }: Props) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [read, setRead] = useState<ReadResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [statusMap, setStatusMap] = useState<Record<string, ItemStatus>>({});
  const [typeMap, setTypeMap] = useState<Record<string, string>>({});
  const [defaultType, setDefaultType] = useState("");
  const [projectName, setProjectName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragging, setDragging] = useState(false);

  const parsed: ParsedImport | null = useMemo(() => {
    if (!read || read.kind === "error") return null;
    if (read.kind === "parsed") return read.parsed;
    return buildFromCsv(read.rows, mapping ?? read.mapping, read.flavor);
  }, [read, mapping]);

  const statuses = useMemo(() => (parsed ? statusChoices(parsed.items) : []), [parsed]);
  const types = useMemo(() => (parsed ? typeChoices(parsed.items) : []), [parsed]);
  const assignees = useMemo(() => (parsed ? assigneeChoices(parsed.items) : []), [parsed]);
  const untyped = parsed ? parsed.items.filter((i) => !i.type?.trim()).length : 0;
  const fallbackType = defaultType || existingTypes[0] || "Task";
  const plan = useMemo(() => (parsed ? buildPlan(parsed, { statusMap, typeMap, defaultType: fallbackType }) : null), [parsed, statusMap, typeMap, fallbackType]);
  const summary = plan ? describePlan(plan) : null;

  const load = async (file: File | undefined) => {
    if (!file) return;
    setError(""); setResult(null);
    if (file.size > IMPORT_LIMITS.fileBytes) { setError(`That file is larger than ${IMPORT_LIMITS.fileBytes / 1024 / 1024} MB. Export a smaller selection and import it in parts.`); return; }
    const text = await file.text();
    const next = readImportFile(text);
    setFileName(file.name);
    setRead(next);
    setMapping(next.kind === "csv" ? next.mapping : null);
    setStatusMap({}); setTypeMap({}); setDefaultType("");
    if (next.kind === "error") setError(next.message);
    if (next.kind === "parsed" && next.parsed.projectName) setProjectName(next.parsed.projectName);
    else if (!projectName) setProjectName(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").slice(0, 120));
  };

  const reset = () => { setRead(null); setMapping(null); setFileName(""); setResult(null); setError(""); if (input.current) input.current.value = ""; };

  const run = async () => {
    if (!plan) return;
    setBusy(true); setError("");
    const out = projectId ? await importItems(projectId, plan) : await importAsNewProject(projectName, plan);
    setBusy(false);
    if (out.error) { setError(out.error); return; }
    setResult(out);
    router.refresh();
  };

  // ---- done --------------------------------------------------------------
  if (result?.summary) {
    const s = result.summary;
    const target = projectId ?? result.projectId;
    return (
      <div className="rounded-lg border border-border bg-panel p-6" role="status" data-testid="import-done">
        <p className="flex items-center gap-2 text-base font-semibold"><CheckCircle2 size={18} className="text-success" /> Imported {s.created} item{s.created === 1 ? "" : "s"}</p>
        <ul className="mt-3 list-inside list-disc text-sm text-muted">
          {s.typesCreated.length > 0 && <li>New item types: {s.typesCreated.join(", ")}</li>}
          {s.sprintsCreated > 0 && <li>{s.sprintsCreated} new sprint{s.sprintsCreated === 1 ? "" : "s"}</li>}
          {s.links > 0 && <li>{s.links} parent link{s.links === 1 ? "" : "s"}</li>}
          {s.dependencies > 0 && <li>{s.dependencies} dependenc{s.dependencies === 1 ? "y" : "ies"}</li>}
          {s.milestonesCreated > 0 && <li>{s.milestonesCreated} milestone{s.milestonesCreated === 1 ? "" : "s"}</li>}
        </ul>
        {s.warnings.map((w) => <p key={w} className="mt-2 flex gap-2 text-sm text-warning"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{w}</p>)}
        <div className="mt-5 flex gap-2">
          {target && <Link href={`/project/${target}/backlog`} className="button-base button-primary button-md no-underline">Open the backlog</Link>}
          <Button variant="ghost" onClick={reset}>Import another file</Button>
        </div>
      </div>
    );
  }

  // ---- pick a file --------------------------------------------------------
  if (!read || read.kind === "error") {
    return (
      <div className="flex flex-col gap-4">
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); void load(e.dataTransfer.files[0]); }}
          className={`flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-colors ${dragging ? "border-accent bg-accent-soft" : "border-border-strong"}`}
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-hover"><Upload size={18} /></span>
          <p className="text-sm">Drop a file here, or</p>
          <input ref={input} id="import-file" type="file" accept=".csv,.json,.txt,text/csv,application/json" className="sr-only" onChange={(e) => void load(e.target.files?.[0])} />
          <label htmlFor="import-file" className="button-base button-primary button-md cursor-pointer"><FileUp size={14} /> Choose a file</label>
          <p className="text-xs text-faint">Jira, Linear, Asana (CSV) · Trello (JSON) · Quick Planner export · any CSV with a header row</p>
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <details className="rounded-lg border border-border bg-panel p-4 text-sm">
          <summary className="cursor-pointer font-medium">How do I export from my current tool?</summary>
          <dl className="mt-3 grid gap-2.5">
            {HOW_TO.map(([tool, how]) => (<div key={tool}><dt className="font-medium">{tool}</dt><dd className="text-muted">{how}</dd></div>))}
          </dl>
        </details>
      </div>
    );
  }

  // ---- review -------------------------------------------------------------
  const csv = read.kind === "csv" ? read : null;
  const currentMapping = mapping ?? csv?.mapping;
  const setField = (field: CsvField, header: string) => {
    if (!currentMapping) return;
    const fields = { ...currentMapping.fields };
    if (header) fields[field] = header; else delete fields[field];
    setMapping({ ...currentMapping, fields });
  };
  const toggleCustom = (header: string) => {
    if (!currentMapping) return;
    const custom = currentMapping.custom.includes(header) ? currentMapping.custom.filter((h) => h !== header) : [...currentMapping.custom, header];
    setMapping({ ...currentMapping, custom });
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-panel px-4 py-3 text-sm">
        <FileUp size={16} className="text-muted" />
        <span className="font-medium">{fileName}</span>
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent" data-testid="import-source">{SOURCE_NAME[parsed?.source ?? "csv"]}</span>
        {summary && <span className="text-muted" data-testid="import-counts">{summary.items} item{summary.items === 1 ? "" : "s"}{summary.sprints > 0 ? ` · ${summary.sprints} sprint${summary.sprints === 1 ? "" : "s"}` : ""}{summary.links > 0 ? ` · ${summary.links} nested` : ""}{summary.dependencies > 0 ? ` · ${summary.dependencies} ${summary.dependencies === 1 ? "dependency" : "dependencies"}` : ""}</span>}
        <button type="button" onClick={reset} className="ml-auto text-xs text-muted underline hover:text-fg">Choose another file</button>
      </div>

      {csv && currentMapping && (
        <section aria-label="Columns" className="rounded-lg border border-border bg-panel p-4">
          <h3 className="mb-1 text-sm font-semibold">Columns</h3>
          <p className="mb-3 text-xs text-muted">We matched your columns automatically. Change anything that looks wrong.</p>
          <div className="grid gap-x-4 gap-y-2.5 sm:grid-cols-2">
            {FIELD_ORDER.map((field) => (
              <div key={field} className="flex items-center gap-2">
                <label htmlFor={`map-${field}`} className="w-28 shrink-0 text-sm text-muted">{CSV_FIELD_LABELS[field]}</label>
                <select id={`map-${field}`} className="input-planner" value={currentMapping.fields[field] ?? ""} onChange={(e) => setField(field, e.target.value)}>
                  <option value="">{field === "title" ? "Choose a column…" : "Not in the file"}</option>
                  {[...new Set(csv.headers)].map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <details className="mt-3 text-sm">
            <summary className="flex cursor-pointer items-center gap-1 text-muted"><ChevronDown size={14} /> Keep other columns as custom fields{currentMapping.custom.length > 0 ? ` (${currentMapping.custom.length})` : ""}</summary>
            <ul className="mt-2 flex flex-wrap gap-2">
              {[...new Set(csv.headers)].filter((h) => !Object.values(currentMapping.fields).includes(h)).map((h) => (
                <li key={h}><label className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs"><input type="checkbox" checked={currentMapping.custom.includes(h)} onChange={() => toggleCustom(h)} /> {h}</label></li>
              ))}
            </ul>
          </details>
        </section>
      )}

      {parsed && parsed.items.length > 0 && (
        <>
          {statuses.length > 0 && (
            <section aria-label="Statuses" className="rounded-lg border border-border bg-panel p-4">
              <h3 className="mb-1 text-sm font-semibold">Statuses</h3>
              <p className="mb-3 text-xs text-muted">Quick Planner has four statuses. Tell us where each of yours belongs.</p>
              <ul className="grid gap-2">
                {statuses.map((s) => (
                  <li key={s.raw} className="flex items-center gap-3 text-sm">
                    <span className="w-48 truncate" title={s.raw}>{s.raw} <span className="text-xs text-faint">· {s.count}</span></span>
                    <select aria-label={`Status for ${s.raw}`} className="input-planner !w-44" value={statusMap[s.raw] ?? s.guess ?? "TODO"} onChange={(e) => setStatusMap((m) => ({ ...m, [s.raw]: e.target.value as ItemStatus }))}>
                      {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    {!s.guess && !statusMap[s.raw] && <span className="text-xs text-warning">not sure, check this</span>}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-label="Item types" className="rounded-lg border border-border bg-panel p-4">
            <h3 className="mb-1 text-sm font-semibold">Item types</h3>
            <p className="mb-3 text-xs text-muted">Types that don&apos;t exist yet are created, and the parent/child rules they need are added for you.</p>
            <datalist id="existing-types">{existingTypes.map((t) => <option key={t} value={t} />)}</datalist>
            <ul className="grid gap-2">
              {types.map((t) => (
                <li key={t.name} className="flex items-center gap-3 text-sm">
                  <span className="w-48 truncate" title={t.name}>{t.name} <span className="text-xs text-faint">· {t.count}</span></span>
                  <Input aria-label={`Item type for ${t.name}`} list="existing-types" value={typeMap[t.name] ?? t.name} onChange={(e) => setTypeMap((m) => ({ ...m, [t.name]: e.target.value }))} maxLength={120} className="!w-56" />
                  {!existingTypes.some((x) => x.toLowerCase() === (typeMap[t.name] ?? t.name).trim().toLowerCase()) && <span className="text-xs text-faint">new</span>}
                </li>
              ))}
              {untyped > 0 && (
                <li className="flex items-center gap-3 text-sm">
                  <span className="w-48 truncate">No type <span className="text-xs text-faint">· {untyped}</span></span>
                  <Input aria-label="Item type for items without one" list="existing-types" value={defaultType || fallbackType} onChange={(e) => setDefaultType(e.target.value)} maxLength={120} className="!w-56" />
                </li>
              )}
            </ul>
          </section>

          {assignees.length > 0 && (
            <section aria-label="People" className="rounded-lg border border-border bg-panel p-4">
              <h3 className="mb-1 text-sm font-semibold">People</h3>
              <p className="mb-3 text-xs text-muted">Assignees are matched to members of {projectId ? "this" : "the new"} project by email or name.{!projectId && " You can invite people after importing."}</p>
              <ul className="grid gap-1.5 text-sm">
                {assignees.slice(0, 12).map((a) => {
                  const match = projectId ? matchPerson(a.label, people) : undefined;
                  return (
                    <li key={a.label} className="flex items-center gap-2">
                      <span className="truncate">{a.label}</span><span className="text-xs text-faint">· {a.count}</span>
                      {projectId && (match ? <span className="text-xs text-success">matched{match.name ? ` to ${match.name}` : ""}</span> : <span className="text-xs text-warning">not a member, left unassigned</span>)}
                    </li>
                  );
                })}
                {assignees.length > 12 && <li className="text-xs text-faint">and {assignees.length - 12} more</li>}
              </ul>
            </section>
          )}

          <section aria-label="Preview" className="overflow-hidden rounded-lg border border-border bg-panel">
            <h3 className="border-b border-border px-4 py-2.5 text-sm font-semibold">Preview</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-muted"><tr><th className="px-4 py-1.5 font-medium">Title</th><th className="font-medium">Type</th><th className="font-medium">Status</th><th className="font-medium">Parent</th><th className="font-medium">Sprint</th></tr></thead>
                <tbody>
                  {plan?.items.slice(0, 8).map((i) => (
                    <tr key={i.ref} className="border-t border-border">
                      <td className="max-w-[260px] truncate px-4 py-1.5">{i.title}</td>
                      <td className="text-muted">{i.type ?? fallbackType}</td>
                      <td className="text-muted">{STATUS_OPTIONS.find((o) => o.value === i.status)?.label}</td>
                      <td className="max-w-[160px] truncate text-muted">{plan.items.find((p) => p.ref === i.parentRef)?.title ?? "—"}</td>
                      <td className="text-muted">{i.sprint ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {plan && plan.items.length > 8 && <p className="border-t border-border px-4 py-2 text-xs text-faint">…and {plan.items.length - 8} more</p>}
          </section>
        </>
      )}

      {parsed?.warnings.map((w) => <p key={w} className="flex gap-2 text-sm text-warning"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{w}</p>)}
      {parsed && parsed.items.length === 0 && !parsed.warnings.length && <p className="text-sm text-danger">No items were found in this file.</p>}

      {!projectId && (
        <div className="max-w-sm">
          <label htmlFor="import-project-name" className="form-field-label">New project name</label>
          <Input id="import-project-name" className="mt-1" value={projectName} onChange={(e) => setProjectName(e.target.value)} maxLength={120} required />
        </div>
      )}

      {error && <p className="text-sm text-danger" role="alert">{error}</p>}
      <div className="flex items-center gap-2">
        <Button onClick={run} loading={busy} disabled={!plan || plan.items.length === 0 || (!projectId && !projectName.trim())}>
          {projectId ? `Import ${summary?.items ?? 0} items` : `Create project with ${summary?.items ?? 0} items`}
        </Button>
        <Button variant="ghost" onClick={reset}>Cancel</Button>
      </div>
    </div>
  );
}
