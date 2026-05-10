"use client";

import { useState } from "react";
import { Plus, Calendar, Play, CheckCircle2, Trash2, Clock } from "lucide-react";
import { createSprint, updateSprintStatus, deleteSprint } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { AIImportModal } from "./ai/AIImportModal";
import { FileJson } from "lucide-react";
import { Button } from "./ui/Button";
import { FormField } from "./ui/FormField";

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
  nodeTypes?: any[];
}

export function SprintPage({ projectId, sprints, nodeTypes = [] }: SprintPageProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

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
    <div className="flex flex-col gap-xl">
      <div className="flex justify-between items-center mb-sm">
        <div>
          <h2 className="text-editorial text-2xl font-bold">Strategic Cycles</h2>
          <p className="text-meta text-xs mt-xs">Milestones and Sprint planning</p>
        </div>
        <Button
          onClick={() => setIsAIModalOpen(true)}
          size="sm"
          icon={<FileJson size={18} />}
        >
          AI PLANNER
        </Button>
      </div>

      <AIImportModal
        projectId={projectId}
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        mode="SPRINT"
        context={{
          sprints: sprints.map((s: any) => ({ name: s.name, status: s.status, startDate: s.startDate, endDate: s.endDate })),
          allNodeTypes: nodeTypes
        }}
      />
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="card-sanctuary sprint-create-button"
        >
          <Plus size={20} />
          <span className="text-meta text-sm">Create New Strategic Cycle</span>
        </button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-sanctuary p-xl border-primary"
        >
          <form onSubmit={handleCreate}>
            <h3 className="mb-xl text-3xl font-bold">Define Milestone</h3>
            <div className="grid grid-cols-3 gap-xl mb-xl">
              <FormField label="Sprint Identity">
                <input
                  className="input-premium p-md"
                  placeholder="e.g. Q3 Strategic Roadmap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Commencement">
                <input
                  type="date"
                  className="input-premium p-md"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </FormField>
              <FormField label="Target Completion">
                <input
                  type="date"
                  className="input-premium p-md"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </FormField>
            </div>
            <div className="flex gap-md">
              <Button type="submit">Initialize Sprint</Button>
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Discard</Button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="flex flex-col gap-md">
        {sprints.map((sprint) => {
          const config = getStatusConfig(sprint.status);
          const Icon = config.icon;

          return (
            <div key={sprint.id} className="card-sanctuary sprint-card">
              <div className="flex items-center gap-xl">
                <div className="sprint-icon-box" style={{ backgroundColor: config.bg, color: config.color }}>
                  <Icon size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-md mb-xs">
                    <h4 className="sprint-name">{sprint.name}</h4>
                    <span className="badge-pill" style={{ backgroundColor: config.bg, color: config.color }}>
                      {sprint.status}
                    </span>
                  </div>
                  <p className="sprint-dates">
                    {sprint.startDate && new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {sprint.endDate && ` — ${new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
                    {!sprint.startDate && "Timeline not defined"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2xl">
                <div className="text-right">
                  <span className="sprint-node-count">{sprint._count?.nodes || 0}</span>
                  <span className="text-meta opacity-50">Nodes Linked</span>
                </div>

                <div className="flex gap-md">
                  {sprint.status === 'PLANNED' && (
                    <Button
                      onClick={() => updateSprintStatus(projectId, sprint.id, 'ACTIVE')}
                      size="sm"
                      icon={<Play size={16} fill="white" />}
                    >
                      Activate
                    </Button>
                  )}
                  {sprint.status === 'ACTIVE' && (
                    <Button
                      onClick={() => updateSprintStatus(projectId, sprint.id, 'COMPLETED')}
                      size="sm"
                      variant="success"
                      icon={<CheckCircle2 size={16} fill="white" />}
                    >
                      Finalize
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this sprint? Linked nodes will be returned to the backlog.')) {
                        deleteSprint(projectId, sprint.id);
                      }
                    }}
                    icon={<Trash2 size={20} />}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {sprints.length === 0 && (
          <div className="sprint-empty-state">
            <Calendar size={64} className="sprint-empty-icon" />
            <p className="sprint-empty-title">No strategic cycles initialized.</p>
            <p className="sprint-empty-desc">Start by defining your first milestone above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
