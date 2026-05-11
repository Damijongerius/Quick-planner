"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Calendar, Rocket } from "lucide-react";
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
    <motion.div 
      initial={{ opacity: 0, y: -20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="card-sanctuary glass p-2xl mb-xl border-primary"
      style={{ borderLeft: '4px solid var(--primary)' }}
    >
      <form onSubmit={handleCreate}>
        <div className="flex items-center gap-md mb-xl">
          <Calendar size={24} className="text-primary" />
          <h3 className="text-3xl font-bold tracking-tight">Initialize Strategic Cycle</h3>
        </div>
        
        <div className="grid grid-cols-3 gap-xl mb-2xl">
          <FormField label="Cycle Identity">
            <input 
              className="input-sanctuary p-md w-full" 
              placeholder="e.g. Q3 Strategic Roadmap" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
            />
          </FormField>
          <FormField label="Commencement">
            <input 
              type="date" 
              className="input-sanctuary p-md w-full" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
            />
          </FormField>
          <FormField label="Target Completion">
            <input 
              type="date" 
              className="input-sanctuary p-md w-full" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
            />
          </FormField>
        </div>
        
        <div className="flex gap-md pt-lg border-t">
          <Button type="submit" icon={<Rocket size={18} />}>
            Activate Cycle
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Discard
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
