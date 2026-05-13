"use client";

import "./SprintPage.css";
import { useState } from "react";
import { Plus, Calendar, FileJson, Target, Rocket, CheckCircle, Clock } from "lucide-react";
import { AIImportModal } from "./ai/AIImportModal";
import { Button } from "./ui/Button";
import { SprintCard } from "./SprintCard";
import { SprintCreationForm } from "./SprintCreationForm";
import { SprintSection } from "./SprintSection";
import { Sprint, NodeType } from "@/lib/types";

interface SprintPageProps {
  projectId: string;
  sprints: Sprint[];
  nodeTypes?: NodeType[];
}

export function SprintPage({ projectId, sprints, nodeTypes = [] }: SprintPageProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const activeSprints = sprints.filter((s: Sprint) => s.status === 'ACTIVE');
  const plannedSprints = sprints.filter((s: Sprint) => s.status === 'PLANNED');
  const completedSprints = sprints.filter((s: Sprint) => s.status === 'COMPLETED');

  return (
    <div className="flex flex-col gap-2xl">
      <div className="flex justify-between items-baseline pb-lg border-b">

        <div>
          <h2 className="text-editorial text-4xl font-bold tracking-tight">Sprint Roadmap</h2>
        </div>

        <div className="flex gap-md">
          <Button 
            onClick={() => setIsAIModalOpen(true)} 
            variant="secondary" 
            icon={<FileJson size={18} />}
          >
            AI Strategy Import
          </Button>
          {!isCreating && (
            <Button 
              onClick={() => setIsCreating(true)} 
              icon={<Plus size={18} />}
            >
              New Sprint
            </Button>
          )}
        </div>
      </div>

      <AIImportModal 
        projectId={projectId} 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        mode="SPRINT" 
        context={{ 
            sprints: sprints.map((s: Sprint) => ({ name: s.name, status: s.status, startDate: s.startDate, endDate: s.endDate })), 
            allNodeTypes: nodeTypes 
        }} 
      />
      
      {isCreating && (
        <SprintCreationForm projectId={projectId} onCancel={() => setIsCreating(false)} />
      )}

      <SprintSection 
        title="Active Engagement"
        icon={Rocket}
        iconColor="text-primary"
        sprints={activeSprints}
        projectId={projectId}
      />

      <SprintSection 
        title="Planned Horizons"
        icon={Clock}
        iconColor="text-on-surface-variant"
        sprints={plannedSprints}
        projectId={projectId}
      />

      <SprintSection 
        title="Completed Milestones"
        icon={CheckCircle}
        iconColor="text-tertiary"
        sprints={completedSprints}
        projectId={projectId}
        className="opacity-60"
      />

      {sprints.length === 0 && !isCreating && (
        <div className="sprint-empty-state">
          <Calendar size={64} className="sprint-empty-icon" />
          <p className="sprint-empty-title">No sprints here yet</p>
          <p className="sprint-empty-desc">Start by defining your first sprint or use AI</p>
          <Button onClick={() => setIsCreating(true)} className="mt-md" variant="secondary" icon={<Plus size={18} />}>
            Create First Sprint
          </Button>
        </div>
      )}
    </div>
  );
}

