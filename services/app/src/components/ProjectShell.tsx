"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopAppBar } from "./TopAppBar";

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
    <div className="app-shell-grid h-screen overflow-hidden bg-surface">
      <Sidebar 
        project={project} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      <div className="main-content-wrapper flex flex-col min-w-0 h-full relative">
        <TopAppBar 
            projectId={projectId} 
            onMenuClick={() => setIsSidebarOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto overflow-x-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsSidebarOpen(false);
            }
          }}
          role="none"
        />
      )}
    </div>
  );
}
