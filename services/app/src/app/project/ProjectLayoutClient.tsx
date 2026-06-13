"use client";

import React, { useEffect, useState } from "react";
import { ProjectShell } from "@/components/ProjectShell";
import { getProject } from "@/lib/actions";
import { useRouter, useSearchParams } from "next/navigation";
import { ProjectProvider } from "@/components/ProjectContext";
import { Project } from "@/lib/types";
import { useAuth } from "@/context/AuthContext";
import { GlobalAIChat } from "@/components/chat/GlobalAIChat";

export default function ProjectLayoutClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get("projectId") || "";
  const [project, setProject] = useState<Project | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!projectId) {
      router.push("/projects");
      return;
    }

    if (user && projectId) {
      setFetching(true);
      getProject(projectId)
        .then((p) => {
          if (!p) {
            router.push("/projects");
          } else {
            setProject(p as Project);
          }
        })
        .catch((err) => {
          console.error("Failed to load project details", err);
          router.push("/projects");
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [user, projectId, router]);

  if (loading || fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl opacity-50">Loading operations console...</div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <ProjectProvider project={project}>
      <ProjectShell project={project} projectId={projectId}>
        {children}
        <GlobalAIChat />
      </ProjectShell>
    </ProjectProvider>
  );
}
