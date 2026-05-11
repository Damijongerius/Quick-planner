"use client";

import "./SprintPage.css";
import { useState } from "react";
import { Plus, Calendar, FileJson, Target, Rocket, CheckCircle, Clock } from "lucide-react";
import { AIImportModal } from "./ai/AIImportModal";
import { Button } from "./ui/Button";
import { SprintCard } from "./SprintCard";
import { SprintCreationForm } from "./SprintCreationForm";

export function SprintPage({ projectId, sprints, nodeTypes = [] }: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  const activeSprints = sprints.filter((s: any) => s.status === 'ACTIVE');
  const plannedSprints = sprints.filter((s: any) => s.status === 'PLANNED');
  const completedSprints = sprints.filter((s: any) => s.status === 'COMPLETED');

  return (
    <div className="flex flex-col gap-2xl">
      <div className="flex justify-between items-end pb-lg border-b">
        <div>
          <div className="flex items-center gap-sm mb-xs">
            <Target size={20} className="text-primary" />
            <span className="text-meta">Strategic Governance</span>
          </div>
          <h2 className="text-editorial text-4xl font-bold tracking-tight">Milestone Roadmap</h2>
          <p className="text-secondary mt-sm opacity-70">Orchestrate and track the progress of your high-level strategic cycles.</p>
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
              New Milestone
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
            sprints: sprints.map((s: any) => ({ name: s.name, status: s.status, startDate: s.startDate, endDate: s.endDate })), 
            allNodeTypes: nodeTypes 
        }} 
      />
      
      {isCreating && (
        <SprintCreationForm projectId={projectId} onCancel={() => setIsCreating(false)} />
      )}

      {/* Active Sprints */}
      {activeSprints.length > 0 && (
        <section className="flex flex-col gap-md">
          <div className="flex items-center gap-sm mb-xs">
            <Rocket size={16} className="text-primary" />
            <h3 className="text-meta">Active Engagement</h3>
          </div>
          <div className="flex flex-col gap-md">
            {activeSprints.map((sprint: any) => <SprintCard key={sprint.id} sprint={sprint} projectId={projectId} />)}
          </div>
        </section>
      )}

      {/* Planned Sprints */}
      {plannedSprints.length > 0 && (
        <section className="flex flex-col gap-md">
          <div className="flex items-center gap-sm mb-xs">
            <Clock size={16} className="text-on-surface-variant" />
            <h3 className="text-meta">Planned Horizons</h3>
          </div>
          <div className="flex flex-col gap-md">
            {plannedSprints.map((sprint: any) => <SprintCard key={sprint.id} sprint={sprint} projectId={projectId} />)}
          </div>
        </section>
      )}

      {/* Completed Sprints */}
      {completedSprints.length > 0 && (
        <section className="flex flex-col gap-md opacity-60">
          <div className="flex items-center gap-sm mb-xs">
            <CheckCircle size={16} className="text-tertiary" />
            <h3 className="text-meta">Completed Milestones</h3>
          </div>
          <div className="flex flex-col gap-md">
            {completedSprints.map((sprint: any) => <SprintCard key={sprint.id} sprint={sprint} projectId={projectId} />)}
          </div>
        </section>
      )}

      {sprints.length === 0 && !isCreating && (
        <div className="sprint-empty-state">
          <Calendar size={64} className="sprint-empty-icon" />
          <p className="sprint-empty-title">No strategic cycles initialized.</p>
          <p className="sprint-empty-desc">Start by defining your first milestone or use the AI Strategy Import.</p>
          <Button onClick={() => setIsCreating(true)} className="mt-md" variant="secondary" icon={<Plus size={18} />}>
            Create First Milestone
          </Button>
        </div>
      )}
    </div>
  );
}

