"use client";

import { useState } from "react";
import { Plus, Calendar, Play, CheckCircle2, Trash2, Clock } from "lucide-react";
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
  projectId: string;
  sprints: Sprint[];
}

export function SprintPage({ projectId, sprints }: SprintPageProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    await createSprint(projectId, name, startDate || undefined, endDate || undefined);
    setIsCreating(false);
    setName("");
    setStartDate("");
    setEndDate("");
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: 'var(--primary)', bg: 'rgba(70, 86, 184, 0.1)', icon: Play };
      case 'COMPLETED': return { color: 'var(--tertiary)', bg: 'rgba(0, 107, 96, 0.1)', icon: CheckCircle2 };
      default: return { color: 'var(--on-surface-variant)', bg: 'var(--surface-container)', icon: Clock };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {!isCreating ? (
        <button 
          onClick={() => setIsCreating(true)}
          className="card-sanctuary" 
          style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '12px', 
              padding: '24px', 
              border: '2px dashed var(--outline-variant)',
              background: 'transparent',
              opacity: 0.7,
              cursor: 'pointer'
          }}
        >
          <Plus size={20} />
          <span style={{ fontWeight: 700, fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Create New Strategic Cycle</span>
        </button>
      ) : (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-sanctuary"
            style={{ padding: '40px', border: '1px solid var(--primary)' }}
        >
            <form onSubmit={handleCreate}>
              <h3 style={{ marginBottom: '32px', fontSize: '24px', fontWeight: 800 }}>Define Milestone</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="text-meta">Sprint Identity</label>
                  <input 
                    className="input-premium" 
                    placeholder="e.g. Q3 Strategic Roadmap" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    style={{ paddingLeft: '20px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="text-meta">Commencement</label>
                  <input 
                    type="date"
                    className="input-premium" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ paddingLeft: '20px' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="text-meta">Target Completion</label>
                  <input 
                    type="date"
                    className="input-premium" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ paddingLeft: '20px' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" className="button-premium">Initialize Sprint</button>
                <button type="button" onClick={() => setIsCreating(false)} className="button-secondary" style={{ border: 'none' }}>Discard</button>
              </div>
            </form>
        </motion.div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sprints.map((sprint) => {
          const config = getStatusConfig(sprint.status);
          const Icon = config.icon;
          
          return (
            <div key={sprint.id} className="card-sanctuary" style={{ padding: '32px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                <div style={{ 
                  width: '56px', 
                  height: '56px', 
                  borderRadius: '16px', 
                  backgroundColor: config.bg, 
                  color: config.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={28} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '4px' }}>
                    <h4 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--on-surface)' }}>{sprint.name}</h4>
                    <span style={{ 
                      fontSize: '9px', 
                      padding: '4px 12px', 
                      borderRadius: '9999px', 
                      backgroundColor: config.bg, 
                      color: config.color,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em'
                    }}>
                      {sprint.status}
                    </span>
                  </div>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: 500 }}>
                    {sprint.startDate && new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
                    {sprint.endDate && ` — ${new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    {!sprint.startDate && "Timeline not defined"}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ display: 'block', fontSize: '24px', fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '-0.025em' }}>{sprint._count?.nodes || 0}</span>
                  <span className="text-meta" style={{ opacity: 0.5 }}>Nodes Linked</span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  {sprint.status === 'PLANNED' && (
                    <button 
                      onClick={() => updateSprintStatus(projectId, sprint.id, 'ACTIVE')}
                      className="button-premium" 
                      style={{ padding: '10px 24px', fontSize: '12px' }}
                    >
                      <Play size={16} fill="white" /> Activate
                    </button>
                  )}
                  {sprint.status === 'ACTIVE' && (
                    <button 
                      onClick={() => updateSprintStatus(projectId, sprint.id, 'COMPLETED')}
                      className="button-premium" 
                      style={{ padding: '10px 24px', fontSize: '12px', backgroundColor: 'var(--tertiary)' }}
                    >
                      <CheckCircle2 size={16} fill="white" /> Finalize
                    </button>
                  )}
                  <button className="button-secondary" style={{ padding: '10px', border: 'none', color: 'var(--error)' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sprints.length === 0 && (
          <div style={{ padding: '120px', textAlign: 'center', opacity: 0.3 }}>
            <Calendar size={64} style={{ margin: '0 auto 24px' }} />
            <p style={{ fontSize: '1.25rem', fontWeight: 700 }}>No strategic cycles initialized.</p>
            <p style={{ fontSize: '0.875rem' }}>Start by defining your first milestone above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
