"use client";

import React, { createContext, useContext } from "react";
import { Project } from "@/lib/types";
import { canEdit, canManage, isProjectRole, type ProjectRole } from "@/lib/roles";
import type { MemberInfo } from "@/lib/actions/members";

interface ProjectContextType {
  project: Project;
  /** Nothing in the project may be changed (archived, or you only have view access). */
  isReadOnly: boolean;
  isArchived: boolean;
  role: ProjectRole;
  /** Owner-only actions: members, rename, archive. */
  isOwner: boolean;
  members: MemberInfo[];
  currentUserId: string;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({
  children,
  project,
  members,
}: Readonly<{
  children: React.ReactNode;
  project: Project;
  members: MemberInfo[];
}>) {
  const value = React.useMemo(() => {
    const role: ProjectRole = isProjectRole(project.role) ? project.role : "VIEWER";
    return {
      project,
      role,
      isArchived: project.isArchived,
      isReadOnly: project.isArchived || !canEdit(role),
      isOwner: canManage(role),
      members,
      currentUserId: project.currentUserId ?? "",
    };
  }, [project, members]);

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
