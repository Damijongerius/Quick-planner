import { ProjectShell } from "@/components/ProjectShell";
import { MigrationGuard } from "@/components/auth/MigrationGuard";
import { getProject } from "@/lib/actions";
import { notFound } from "next/navigation";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await getProject(projectId);

  if (!project) {
    notFound();
  }

  return (
    <MigrationGuard>
      <ProjectShell project={project} projectId={projectId}>
        {children}
      </ProjectShell>
    </MigrationGuard>
  );
}
