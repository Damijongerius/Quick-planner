"use client";

import React from "react";
import { Play, CheckCircle2, Trash2, Clock } from "lucide-react";
import { Button } from "./ui/Button";
import { Badge } from "./ui/Badge";
import { Card } from "./ui/Card";

interface SprintCardProps {
  sprint: any;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

export function SprintCard({ sprint, onStatusChange, onDelete }: SprintCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { color: 'var(--primary)', bg: 'rgba(70, 86, 184, 0.1)', icon: Play, label: 'Active' };
      case 'COMPLETED': return { color: 'var(--tertiary)', bg: 'rgba(0, 107, 96, 0.1)', icon: CheckCircle2, label: 'Completed' };
      default: return { color: 'var(--on-surface-variant)', bg: 'var(--surface-container)', icon: Clock, label: 'Planned' };
    }
  };

  const config = getStatusConfig(sprint.status);
  const Icon = config.icon;

  return (
    <Card variant="flat" className="sprint-card">
      <div className="flex items-center gap-xl">
        <div 
          className="sprint-icon-box"
          style={{ backgroundColor: config.bg, color: config.color }}
        >
          <Icon size={28} />
        </div>
        <div>
          <div className="flex items-center gap-md mb-xs">
            <h4 className="text-xl font-bold text-on-surface">{sprint.name}</h4>
            <Badge 
              variant="secondary" 
              className="badge-pill"
              style={{ backgroundColor: config.bg, color: config.color }}
            >
                {config.label.toUpperCase()}
            </Badge>
          </div>
          <p className="text-sm font-medium text-on-surface-variant">
            {sprint.startDate && new Date(sprint.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} 
            {sprint.endDate && ` — ${new Date(sprint.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            {!sprint.startDate && "Timeline not defined"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2xl">
        <div className="text-right">
          <span className="block text-2xl font-bold text-on-surface tracking-tight">{sprint._count?.nodes || 0}</span>
          <span className="text-meta opacity-50">Nodes Linked</span>
        </div>

         <div className="flex gap-md">
          {sprint.status === 'PLANNED' && (
            <Button 
              onClick={() => onStatusChange(sprint.id, 'ACTIVE')}
              size="sm"
              icon={<Play size={16} fill="white" />}
            >
              Activate
            </Button>
          )}
          {sprint.status === 'ACTIVE' && (
            <Button 
              onClick={() => onStatusChange(sprint.id, 'COMPLETED')}
              size="sm"
              variant="secondary"
              icon={<CheckCircle2 size={16} fill="white" />}
              className="bg-tertiary text-white border-none"
            >
              Finalize
            </Button>
          )}
          <Button 
            variant="ghost"
            size="sm"
            onClick={() => onDelete(sprint.id)}
            icon={<Trash2 size={20} />}
            className="text-error"
          />
        </div>
      </div>
    </Card>
  );
}
