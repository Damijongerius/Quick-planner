"use client";

import { useState } from "react";
import { Plus, Calendar, Play, CheckCircle2, Trash2, Check } from "lucide-react";
import { createSprint, updateSprintStatus } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

interface Sprint {
  id: string;
  name: string;
  startDate: string | Date | null;
  endDate: string | Date | null;
  status: string;
  _count?: { nodes: number };
}

interface SprintPageProps {
  sprints: Sprint[];
}

export function SprintPage({ sprints }: SprintPageProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await createSprint(name, startDate || undefined, endDate || undefined);
    setIsCreating(false);
    setName("");
    setStartDate("");
    setEndDate("");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#10b981';
      case 'COMPLETED': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  return (
    <div style={{ maxWidth: '1000px' }}>
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Sprints</h2>
          <p style={{ color: '#9ca3af' }}>Plan and manage your development cycles.</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="button-premium"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={18} /> New Sprint
        </button>
      </header>

      <AnimatePresence>
        {isCreating && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="glass"
            style={{ padding: '32px', marginBottom: '40px', overflow: 'hidden' }}
          >
            <form onSubmit={handleCreate}>
              <h3 style={{ marginBottom: '24px', fontSize: '1.25rem' }}>Create New Sprint</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Sprint Name</label>
                  <input 
                    className="input-premium" 
                    placeholder="e.g. Sprint 1 - Core MVP" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>Start Date</label>
                  <input 
                    type="date"
                    className="input-premium" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px' }}>End Date</label>
                  <input 
                    type="date"
                    className="input-premium" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ colorScheme: 'dark' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="button-premium">Create Sprint</button>
                <button type="button" onClick={() => setIsCreating(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sprints.map((sprint) => (
          <div key={sprint.id} className="glass" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: `${getStatusColor(sprint.status)}20`, 
                color: getStatusColor(sprint.status),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Calendar size={24} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600 }}>{sprint.name}</h4>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    padding: '2px 8px', 
                    borderRadius: '99px', 
                    backgroundColor: `${getStatusColor(sprint.status)}20`, 
                    color: getStatusColor(sprint.status),
                    fontWeight: 700,
                    textTransform: 'uppercase'
                  }}>
                    {sprint.status}
                  </span>
                </div>
                <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                  {sprint.startDate && new Date(sprint.startDate).toLocaleDateString()} 
                  {sprint.endDate && ` - ${new Date(sprint.endDate).toLocaleDateString()}`}
                  {!sprint.startDate && "No dates set"}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '1.25rem', fontWeight: 700 }}>{sprint._count?.nodes || 0}</span>
                <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>Items</span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {sprint.status === 'PLANNED' && (
                  <button 
                    onClick={() => updateSprintStatus(sprint.id, 'ACTIVE')}
                    className="button-premium" 
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#10b981' }}
                  >
                    <Play size={16} /> Start
                  </button>
                )}
                {sprint.status === 'ACTIVE' && (
                  <button 
                    onClick={() => updateSprintStatus(sprint.id, 'COMPLETED')}
                    className="button-premium" 
                    style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3b82f6' }}
                  >
                    <CheckCircle2 size={16} /> Complete
                  </button>
                )}
                <button style={{ padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)', color: '#ef4444', background: 'none' }}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {sprints.length === 0 && (
          <div style={{ padding: '80px', textAlign: 'center', opacity: 0.3 }}>
            <Calendar size={64} style={{ marginBottom: '24px' }} />
            <p style={{ fontSize: '1.25rem' }}>No sprints found.</p>
            <p>Create your first sprint to start planning.</p>
          </div>
        )}
      </div>
    </div>
  );
}
