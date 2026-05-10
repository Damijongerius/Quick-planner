"use client";

import { useState } from "react";
import { Plus, Calendar, FileJson } from "lucide-react";
import { AIImportModal } from "./ai/AIImportModal";
import { Button } from "./ui/Button";
import { SprintCard } from "./SprintCard";
import { SprintCreationForm } from "./SprintCreationForm";

export function SprintPage({ projectId, sprints, nodeTypes = [] }: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  return (
    <div className="flex flex-col gap-xl">
      <div className="flex justify-between items-center mb-sm">
        <div><h2 className="text-editorial text-2xl font-bold">Strategic Cycles</h2><p className="text-meta text-xs mt-xs">Milestones and Sprint planning</p></div>
        <Button onClick={() => setIsAIModalOpen(true)} size="sm" icon={<FileJson size={18} />}>AI PLANNER</Button>
      </div>

      <AIImportModal projectId={projectId} isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} mode="SPRINT" context={{ sprints: sprints.map((s: any) => ({ name: s.name, status: s.status, startDate: s.startDate, endDate: s.endDate })), allNodeTypes: nodeTypes }} />
      
      {!isCreating ? (
        <button onClick={() => setIsCreating(true)} className="card-sanctuary sprint-create-button"><Plus size={20} /><span className="text-meta text-sm">Create New Strategic Cycle</span></button>
      ) : (
        <SprintCreationForm projectId={projectId} onCancel={() => setIsCreating(false)} />
      )}

      <div className="flex flex-col gap-md">
        {sprints.map((sprint: any) => <SprintCard key={sprint.id} sprint={sprint} projectId={projectId} />)}
        {sprints.length === 0 && (
          <div className="sprint-empty-state"><Calendar size={64} className="sprint-empty-icon" /><p className="sprint-empty-title">No strategic cycles initialized.</p><p className="sprint-empty-desc">Start by defining your first milestone above.</p></div>
        )}
      </div>
    </div>
  );
}
