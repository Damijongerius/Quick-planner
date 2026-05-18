import { ProjectShell } from "@/components/ProjectShell";
import { MigrationGuard } from "@/components/auth/MigrationGuard";
import { getProject } from "@/lib/actions";
import { notFound, redirect } from "next/navigation";
import { ProjectProvider } from "@/components/ProjectContext";
import { Project } from "@/lib/types";
import { auth } from "@/auth";
import { GlobalAIChat } from "@/components/chat/GlobalAIChat";
import { Providers } from "@/components/Providers";

export const dynamic = 'force-dynamic';

export default async function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}>) {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const { projectId } = await params;
  const project = await getProject(projectId);


  if (!project) {
    notFound();
  }

  return (
    <Providers>
      <MigrationGuard>
        <ProjectProvider project={project as Project}>
          <ProjectShell project={project} projectId={projectId}>
            {children}
            <GlobalAIChat />
          </ProjectShell>
        </ProjectProvider>
      </MigrationGuard>
    </Providers>
  );
}
