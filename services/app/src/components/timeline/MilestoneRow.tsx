"use client";

import React, { useState } from "react";
import { Diamond, Trash2 } from "lucide-react";
import { createMilestone, deleteMilestone, updateMilestone, type MilestoneInfo } from "@/lib/actions";
import { Button } from "../ui/Button";
import { FormField } from "../ui/FormField";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";

export const MILESTONE_COLORS = ["#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

const toDay = (value: string) => new Date(value).toISOString().slice(0, 10);

/** The strip under the sprints where releases and deadlines sit, plus lines running down through the bars. */
export function MilestoneMarkers({ milestones, getDayOffset, viewScale, onOpen }: Readonly<{
  milestones: MilestoneInfo[];
  getDayOffset: (date: string | Date | null | undefined) => number | null;
  viewScale: "days" | "weeks";
  onOpen: (milestone: MilestoneInfo) => void;
}>) {
  const placed = milestones
    .map((m) => ({ m, offset: getDayOffset(toDay(m.date) + "T12:00:00") }))
    .filter((x): x is { m: MilestoneInfo; offset: number } => x.offset !== null);
  const x = (offset: number) => (viewScale === "days" ? offset * 40 + 20 : (offset / 7) * 140 + 10);

  return (
    <>
      <div className="gantt-milestone-row" data-testid="milestone-row">
        {placed.map(({ m, offset }) => (
          <button
            key={m.id}
            type="button"
            className="gantt-milestone-chip"
            style={{ left: `${x(offset)}px`, "--milestone": m.color } as React.CSSProperties}
            onClick={() => onOpen(m)}
            aria-label={`Milestone ${m.name}, ${new Date(m.date).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" })}`}
          >
            <Diamond size={11} fill="currentColor" aria-hidden />
            <span>{m.name}</span>
          </button>
        ))}
      </div>
      {placed.map(({ m, offset }) => (
        <div key={`line-${m.id}`} className="gantt-milestone-line" style={{ left: `${x(offset)}px`, "--milestone": m.color } as React.CSSProperties} aria-hidden />
      ))}
    </>
  );
}

/** Create / edit / delete one milestone. `milestone` null means "new". */
export function MilestoneDialog({ projectId, open, milestone, canEdit, onClose }: Readonly<{
  projectId: string;
  open: boolean;
  milestone: MilestoneInfo | null;
  canEdit: boolean;
  onClose: () => void;
}>) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [color, setColor] = useState(MILESTONE_COLORS[0]);
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [seen, setSeen] = useState<string | null | undefined>(undefined);

  // Load the form when the dialog opens for a (different) milestone.
  const key = open ? (milestone?.id ?? "new") : null;
  if (key !== seen) {
    setSeen(key);
    if (open) {
      setName(milestone?.name ?? "");
      setDate(milestone ? toDay(milestone.date) : "");
      setColor(milestone?.color ?? MILESTONE_COLORS[0]);
      setDescription(milestone?.description ?? "");
      setError("");
    }
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = milestone
      ? await updateMilestone(projectId, milestone.id, { name, date, color, description })
      : await createMilestone(projectId, { name, date, color, description });
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    onClose();
  };

  const remove = async () => {
    if (!milestone || !confirm(`Delete the milestone “${milestone.name}”?`)) return;
    setBusy(true);
    const result = await deleteMilestone(projectId, milestone.id);
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={onClose} title={milestone ? (canEdit ? "Edit milestone" : milestone.name) : "New milestone"} subtitle="A release, deadline or any date the team is working towards." maxWidth="440px">
      <form onSubmit={save} className="flex flex-col gap-4">
        <FormField label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required autoFocus disabled={!canEdit} placeholder="e.g. Beta release" /></FormField>
        <FormField label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required disabled={!canEdit} /></FormField>
        <FormField label="Notes"><Input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} disabled={!canEdit} placeholder="Optional" /></FormField>
        <div role="radiogroup" aria-label="Colour" className="flex gap-2">
          {MILESTONE_COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={`Colour ${c}`} disabled={!canEdit} onClick={() => setColor(c)} className={`h-6 w-6 rounded-full ring-offset-2 ring-offset-panel ${color === c ? "ring-2 ring-fg" : ""}`} style={{ background: c }} />
          ))}
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        {canEdit && (
          <div className="flex items-center gap-2">
            <Button type="submit" loading={busy}>{milestone ? "Save" : "Add milestone"}</Button>
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            {milestone && <Button type="button" variant="ghost" className="ml-auto hover:!text-danger" onClick={remove} icon={<Trash2 size={14} />}>Delete</Button>}
          </div>
        )}
      </form>
    </Modal>
  );
}
