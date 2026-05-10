"use client";

import React from 'react';
import { Play, CheckCircle2, Trash2, Clock } from "lucide-react";
import { Button } from "./ui/Button";
import { updateSprintStatus, deleteSprint } from "@/lib/actions";

export function SprintCard({ sprint, projectId }: any) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: 'var(--primary)', bg: 'rgba(70, 86, 184, 0.1)', icon: Play };
      case 'COMPLETED': return { color: 'var(--tertiary)', bg: 'rgba(0, 107, 96, 0.1)', icon: CheckCircle2 };
      default: return { color: 'var(--on-surface-variant)', bg: 'var(--surface-container)', icon: Clock };
    }
  };

  const config = getStatusConfig(sprint.status);
  const Icon = config.icon;

  return (
    <div className="card-sanctuary sprint-card">
      <div className="flex items-center gap-xl">
        <div className="sprint-icon-box" style={{ backgroundColor: config.bg, color: config.color }}><Icon size={28} /></div>
        <div>
          <div className="flex items-center gap-md mb-xs">
            <h4 className="sprint-name">{sprint.name}</h4>
            <span className="badge-pill" style={{ backgroundColor: config.bg, color: config.color }}>{sprint.status}</span>
          </div>
          <p className="sprint-dates">
            {sprint.startDate && new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            {sprint.endDate && ` — ${new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            {!sprint.startDate && "Timeline not defined"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2xl">
        <div className="text-right"><span className="sprint-node-count">{sprint._count?.nodes || 0}</span><span className="text-meta opacity-50">Nodes Linked</span></div>
        <div className="flex gap-md">
          {sprint.status === 'PLANNED' && <Button onClick={() => updateSprintStatus(projectId, sprint.id, 'ACTIVE')} size="sm" icon={<Play size={16} fill="white" />}>Activate</Button>}
          {sprint.status === 'ACTIVE' && <Button onClick={() => updateSprintStatus(projectId, sprint.id, 'COMPLETED')} size="sm" variant="success" icon={<CheckCircle2 size={16} fill="white" />}>Finalize</Button>}
          <Button variant="danger" size="sm" onClick={() => confirm('Delete sprint?') && deleteSprint(projectId, sprint.id)} icon={<Trash2 size={20} />} />
        </div>
      </div>
    </div>
  );
}
