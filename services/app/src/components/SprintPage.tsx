"use client";

import { useState } from "react";
import { Plus, CalendarRange } from "lucide-react";
import { Button } from "./ui/Button";
import { PageHeader } from "./PageHeader";
import { SprintCreationForm } from "./SprintCreationForm";
import { SprintCard, SprintWithCounts } from "./SprintCard";
import { Sprint, NodeType } from "@/lib/types";
import { useProject } from "./ProjectContext";

interface SprintPageProps {
  readonly projectId: string;
  readonly sprints: Sprint[];
  readonly nodeTypes?: NodeType[];
}

export function SprintPage({ projectId, sprints }: SprintPageProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { isReadOnly } = useProject();

  const all = sprints as SprintWithCounts[];
  const groups = [
    { title: "Active", items: all.filter((s) => s.status === "ACTIVE") },
    { title: "Planned", items: all.filter((s) => s.status === "PLANNED") },
    { title: "Completed", items: all.filter((s) => s.status === "COMPLETED") },
  ];

  return (
    <div>
      <PageHeader
        title="Sprints"
        description="Plan work in time-boxed cycles. Only one sprint can be active at a time."
        actions={!isReadOnly && !isCreating && <Button data-shortcut-create onClick={() => setIsCreating(true)} icon={<Plus size={14} />}>New sprint</Button>}
      />

      {isCreating && <SprintCreationForm projectId={projectId} onCancel={() => setIsCreating(false)} />}

      <div className="flex flex-col gap-6">
        {groups.map((group) =>
          group.items.length === 0 ? null : (
            <section key={group.title}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-muted">
                {group.title} <span className="text-xs text-faint">{group.items.length}</span>
              </h2>
              <div className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
                {group.items.map((sprint) => (
                  <SprintCard key={sprint.id} sprint={sprint} projectId={projectId} isReadOnly={isReadOnly} />
                ))}
              </div>
            </section>
          )
        )}

        {sprints.length === 0 && !isCreating && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-faint"><CalendarRange size={20} /></div>
            <p className="text-sm font-medium">No sprints yet</p>
            <p className="max-w-xs text-sm text-muted">{isReadOnly ? "This project has no sprints." : "Create a sprint to start planning work in cycles."}</p>
            {!isReadOnly && <Button className="mt-2" variant="secondary" onClick={() => setIsCreating(true)} icon={<Plus size={14} />}>Create first sprint</Button>}
          </div>
        )}
      </div>
    </div>
  );
}
