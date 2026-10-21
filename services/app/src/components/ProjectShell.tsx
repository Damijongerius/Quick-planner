"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopAppBar } from "./TopAppBar";
import { RealtimeProvider } from "./realtime/RealtimeProvider";
import { KeyboardShortcuts } from "./KeyboardShortcuts";

interface Project {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ProjectShellProps {
  children: React.ReactNode;
  project: Project;
  projectId: string;
}

export function ProjectShell({ children, project, projectId }: Readonly<ProjectShellProps>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <RealtimeProvider projectId={projectId}>
    <div className="app-shell-grid bg-bg">
      <KeyboardShortcuts projectId={projectId} />
      <Sidebar project={project} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="main-content-wrapper relative flex min-w-0 flex-col">
        <TopAppBar projectId={projectId} onMenuClick={() => setIsSidebarOpen(true)} />
        <main className="flex-1">{children}</main>
      </div>

      {isSidebarOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-[90] cursor-default bg-black/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
    </RealtimeProvider>
  );
}
