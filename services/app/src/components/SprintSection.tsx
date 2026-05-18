"use client";

import { Sprint } from "@/lib/types";
import { SprintCard } from "./SprintCard";
import { LucideIcon } from "lucide-react";

interface SprintSectionProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  sprints: (Sprint & { _count?: { nodes: number } })[];
  projectId: string;
  className?: string;
  isReadOnly?: boolean;
}

export function SprintSection({ 
  title, 
  icon: Icon, 
  iconColor, 
  sprints, 
  projectId, 
  className = "",
  isReadOnly
}: Readonly<SprintSectionProps>) {
  if (sprints.length === 0) return null;

  return (
    <section className={`flex flex-col gap-md ${className}`}>
      <div className="flex items-center gap-sm mb-xs">
        <Icon size={16} className={iconColor} />
        <h3 className="text-meta">{title}</h3>
      </div>
      <div className="flex flex-col gap-md">
        {sprints.map((sprint) => (
          <SprintCard key={sprint.id} sprint={sprint} projectId={projectId} isReadOnly={isReadOnly} />
        ))}
      </div>
    </section>
  );
}
