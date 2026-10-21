import { acceptPendingInvitesForUser, getProjects } from "@/lib/actions";
import { Project } from "@/lib/types";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AccountMenu } from "@/components/AccountMenu";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectForm } from "@/components/projects/NewProjectForm";
import { Providers } from "@/components/Providers";

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  // Invitations sent to this email are accepted automatically, so shared projects simply appear.
  await acceptPendingInvitesForUser();
  const allProjects: Project[] = await getProjects();
  const activeProjects = allProjects.filter((p) => !p.isArchived);
  const archivedProjects = allProjects.filter((p) => p.isArchived);

  return (
    <Providers>
      <div className="mx-auto min-h-screen max-w-6xl px-6 pb-16">
        <header className="flex items-center justify-between py-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-sm font-bold text-accent-fg">P</span>
            <span className="text-base font-semibold">Planner</span>
          </div>
          <AccountMenu />
        </header>

        <div className="mb-6 mt-6">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="mt-1 text-sm text-muted">Pick up where you left off, or start something new.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
          <NewProjectForm />
        </div>

        {archivedProjects.length > 0 && (
          <details className="mt-10 group">
            <summary className="cursor-pointer list-none text-sm font-medium text-muted hover:text-fg">
              Archived projects <span className="text-faint">({archivedProjects.length})</span>
            </summary>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedProjects.map((project) => (
                <ProjectCard key={project.id} project={project} isArchived />
              ))}
            </div>
          </details>
        )}
      </div>
    </Providers>
  );
}
