"use client";

import React from 'react';
import { Play, CheckCircle2, Trash2, Clock, Calendar, LucideIcon } from "lucide-react";
import { Button } from "./ui/Button";
import { updateSprintStatus, deleteSprint } from "@/lib/actions";
import { Sprint } from "@/lib/types";

interface SprintCardProps {
  sprint: Sprint & { _count?: { nodes: number } };
  projectId: string;
  isReadOnly?: boolean;
}

export function SprintCard({ sprint, projectId, isReadOnly }: Readonly<SprintCardProps>) {
  const getStatusConfig = (status: string): { color: string, bg: string, icon: LucideIcon } => {
    switch (status) {
      case 'ACTIVE': return { color: 'var(--primary)', bg: 'rgba(70, 86, 184, 0.1)', icon: Play };
      case 'COMPLETED': return { color: 'var(--tertiary)', bg: 'rgba(0, 107, 96, 0.1)', icon: CheckCircle2 };
      default: return { color: 'var(--on-surface-variant)', bg: 'var(--surface-container)', icon: Clock };
    }
  };

  const config = getStatusConfig(sprint.status);
  const Icon = config.icon;

  return (
    <div className="card-planner sprint-card">
      <div className="flex items-center gap-xl">
        <div className="sprint-icon-box" style={{ backgroundColor: config.bg, color: config.color }}>
          <Icon size={24} />
        </div>
        
        <div>
          <div className="flex items-center gap-md mb-xs">
            <h4 className="sprint-name">{sprint.name}</h4>
            <span className="badge-pill" style={{ backgroundColor: config.bg, color: config.color }}>
              {sprint.status}
            </span>
          </div>
          <div className="flex items-center gap-sm sprint-dates">
            <Calendar size={14} className="opacity-60" />
            <span suppressHydrationWarning>
              {sprint.startDate && new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {sprint.endDate && ` — ${new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              {!sprint.startDate && "No timeline set"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2xl">
        <div className="flex flex-col items-end">
          <div className="flex items-center gap-xs">
            <span className="sprint-node-count">{sprint._count?.nodes || 0}</span>
            <span className="text-meta opacity-50" style={{ marginTop: '4px' }}>Nodes</span>
          </div>
          {/* Progress Bar Mockup */}
          <div style={{ width: '120px', height: '6px', background: 'var(--surface-container)', borderRadius: '3px', marginTop: '8px', overflow: 'hidden' }}>
            <div style={{ width: sprint.status === 'COMPLETED' ? '100%' : '35%', height: '100%', background: config.color, borderRadius: '3px' }} />
          </div>
        </div>

        {!isReadOnly && (
          <div className="flex gap-sm">
            {sprint.status === 'PLANNED' && (
              <Button 
                onClick={() => updateSprintStatus(projectId, sprint.id, 'ACTIVE')} 
                size="sm" 
                icon={<Play size={16} fill="currentColor" />}
              >
                Activate
              </Button>
            )}
            {sprint.status === 'ACTIVE' && (
              <Button 
                onClick={() => updateSprintStatus(projectId, sprint.id, 'COMPLETED')} 
                size="sm" 
                variant="success" 
                icon={<CheckCircle2 size={16} />}
              >
                Finalize
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-error hover:bg-error/10"
              onClick={() => confirm('Are you sure you want to delete this strategic cycle?') && deleteSprint(projectId, sprint.id)} 
              icon={<Trash2 size={18} />} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
