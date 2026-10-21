"use client";

import React, { useState } from "react";
import { Button } from "./ui/Button";
import { FormField } from "./ui/FormField";
import { Input } from "./ui/Input";
import { createSprint } from "@/lib/actions";

export function SprintCreationForm({ projectId, onCancel }: Readonly<{ projectId: string; onCancel: () => void }>) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (startDate && endDate && endDate < startDate) {
      setError("The end date can't be before the start date.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createSprint(projectId, name, startDate || undefined, endDate || undefined);
      onCancel();
    } catch {
      setError("Couldn't create the sprint. Check the name and dates.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleCreate} className="mb-6 rounded-lg border border-border bg-panel p-4 shadow-sm animate-fade-in">
      <h2 className="mb-3 text-sm font-semibold">New sprint</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Name">
          <Input autoFocus placeholder="e.g. Sprint 4" value={name} onChange={(e) => setName(e.target.value)} required />
        </FormField>
        <FormField label="Start date">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </FormField>
        <FormField label="End date">
          <Input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} />
        </FormField>
      </div>
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}
      <div className="mt-4 flex gap-2">
        <Button type="submit" loading={saving}>Create sprint</Button>
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
