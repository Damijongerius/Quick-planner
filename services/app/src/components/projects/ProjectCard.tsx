"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  isArchived?: boolean;
  availableImages?: string[];
}

export function ProjectCard({ project, isArchived, availableImages }: Readonly<ProjectCardProps>) {
  const images = availableImages || [];
  
  // Deterministically select an image based on the project ID
  const charSum = project.id.split('').reduce((acc, char) => acc + (char.codePointAt(0) || 0), 0);
  const bgImage = images[charSum % images.length];

  if (isArchived) {
    return (
      <Link 
        href={`/project/${project.id}/board`}
        className="group no-underline relative overflow-hidden block h-full rounded-2xl"
      >
        <div className="project-card-image grayscale opacity-20" style={{ backgroundImage: `url(${bgImage})` }}></div>
        <div className="project-card-overlay"></div>
        
        <div className="card-planner glass h-full p-2xl border-dashed opacity-80 relative z-10">
          <div className="flex flex-col h-full justify-between">
            <div>
              <h3 className="text-editorial text-xl font-bold mb-xs opacity-60">{project.name}</h3>
              <p className="text-meta text-[10px] opacity-30 uppercase tracking-widest">
                DECOMMISSIONED
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link 
      href={`/project/${project.id}/board`}
      className="group no-underline relative overflow-hidden block h-full rounded-2xl"
    >
      <div className="project-card-image" style={{ backgroundImage: `url(${bgImage})` }}></div>
      <div className="project-card-overlay"></div>

      <div className="card-planner glass h-full p-2xl transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-planner relative z-10">
        <div className="flex flex-col h-full justify-between">
          <div className="project-card-content transition-transform duration-500 group-hover:translate-x-1">
            <h3 className="text-editorial text-2xl font-bold mb-xs">{project.name}</h3>
            <p className="text-meta text-[10px] opacity-40 uppercase tracking-widest">
              Established {new Date(project.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="mt-2xl flex items-center gap-sm text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-2 group-hover:translate-y-0">
            Enter Workspace <ChevronRight size={14} />
          </div>
        </div>
      </div>
    </Link>
  );
}
