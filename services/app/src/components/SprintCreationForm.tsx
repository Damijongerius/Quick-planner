"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "./ui/Button";
import { FormField } from "./ui/FormField";
import { createSprint } from "@/lib/actions";

export function SprintCreationForm({ projectId, onCancel }: any) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await createSprint(projectId, name, startDate || undefined, endDate || undefined);
    onCancel();
  };

  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="card-sanctuary p-xl border-primary">
      <form onSubmit={handleCreate}>
        <h3 className="mb-xl text-3xl font-bold">Define Milestone</h3>
        <div className="grid grid-cols-3 gap-xl mb-xl">
          <FormField label="Sprint Identity"><input className="input-sanctuary p-md" placeholder="e.g. Q3 Strategic Roadmap" value={name} onChange={(e) => setName(e.target.value)} required /></FormField>
          <FormField label="Commencement"><input type="date" className="input-sanctuary p-md" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></FormField>
          <FormField label="Target Completion"><input type="date" className="input-sanctuary p-md" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></FormField>
        </div>
        <div className="flex gap-md"><Button type="submit">Initialize Sprint</Button><Button type="button" variant="ghost" onClick={onCancel}>Discard</Button></div>
      </form>
    </motion.div>
  );
}
