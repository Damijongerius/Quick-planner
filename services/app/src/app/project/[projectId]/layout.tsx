import { ProjectShell } from "@/components/ProjectShell";
import { MigrationGuard } from "@/components/auth/MigrationGuard";
import { getProject } from "@/lib/actions";
import { notFound } from "next/navigation";
import { ProjectProvider } from "@/components/ProjectContext";
import { Project } from "@/lib/types";

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <MigrationGuard>
      <ProjectProvider project={project as Project}>
        <ProjectShell project={project} projectId={projectId}>
          {children}
        </ProjectShell>
      </ProjectProvider>
    </MigrationGuard>
  );
}
