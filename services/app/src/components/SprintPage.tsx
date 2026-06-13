"use client";

import "./SprintPage.css";
import { useState } from "react";
import { Plus, Calendar, Rocket, CheckCircle, Clock } from "lucide-react";
import { Button } from "./ui/Button";
import { SprintCreationForm } from "./SprintCreationForm";
import { SprintSection } from "./SprintSection";
import { Sprint, NodeType } from "@/lib/types";
import { useProject } from "./ProjectContext";

interface SprintPageProps {
  readonly projectId: string;
  readonly sprints: Sprint[];
  readonly nodeTypes?: NodeType[];
  readonly onRefresh?: () => void;
}

export function SprintPage({ projectId, sprints, nodeTypes = [], onRefresh }: SprintPageProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { isReadOnly } = useProject();

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
           {!isReadOnly && (
             <>
               {!isCreating && (
                 <Button 
                   onClick={() => setIsCreating(true)} 
                   icon={<Plus size={18} />}
                 >
                   New Sprint
                 </Button>
               )}
             </>
           )}
         </div>
      </div>


      
      {isCreating && (
        <SprintCreationForm 
          projectId={projectId} 
          onCancel={() => setIsCreating(false)} 
          onSuccess={() => {
            setIsCreating(false);
            onRefresh?.();
          }}
        />
      )}

       <SprintSection 
         title="Active Engagement"
         icon={Rocket}
         iconColor="text-primary"
         sprints={activeSprints}
         projectId={projectId}
         isReadOnly={isReadOnly}
         onRefresh={onRefresh}
       />

       <SprintSection 
         title="Planned Horizons"
         icon={Clock}
         iconColor="text-on-surface-variant"
         sprints={plannedSprints}
         projectId={projectId}
         isReadOnly={isReadOnly}
         onRefresh={onRefresh}
       />

       <SprintSection 
         title="Completed Milestones"
         icon={CheckCircle}
         iconColor="text-tertiary"
         sprints={completedSprints}
         projectId={projectId}
         isReadOnly={isReadOnly}
         className="opacity-60"
         onRefresh={onRefresh}
       />

       {sprints.length === 0 && !isCreating && (
         <div className="sprint-empty-state">
           <Calendar size={64} className="sprint-empty-icon" />
           <p className="sprint-empty-title">No sprints here yet</p>
           <p className="sprint-empty-desc">{isReadOnly ? 'This project has no sprints defined.' : 'Start by defining your first sprint'}</p>
           {!isReadOnly && (
             <Button onClick={() => setIsCreating(true)} className="mt-md" variant="secondary" icon={<Plus size={18} />}>
               Create First Sprint
             </Button>
           )}
         </div>
       )}
    </div>
  );
}

