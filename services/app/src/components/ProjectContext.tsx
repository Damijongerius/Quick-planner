"use client";

import React, { createContext, useContext } from "react";
import { Project } from "@/lib/types";

interface ProjectContextType {
  project: Project;
  isReadOnly: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ 
  children, 
  project 
}: Readonly<{ 
  children: React.ReactNode; 
  project: Project;
}>) {
  const value = React.useMemo(() => ({
    project,
    isReadOnly: project.isArchived
  }), [project]);

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
