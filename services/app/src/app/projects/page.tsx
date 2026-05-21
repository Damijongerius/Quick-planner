import { getProjects, createProject } from "@/lib/actions";
import { Project } from "@/lib/types";
import fs from 'node:fs';
import path from 'node:path';
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ProjectGrid } from "@/components/projects/ProjectGrid";

import { Providers } from "@/components/Providers";

export const dynamic = 'force-dynamic';

async function handleCreateProject(formData: FormData) {
  "use server";
  const name = formData.get("name") as string;
  if (name) await createProject(name);
}

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const allProjects: Project[] = await getProjects();
  const activeProjects = allProjects.filter((p: Project) => !p.isArchived);
  const archivedProjects: Project[] = allProjects.filter((p: Project) => p.isArchived);
 
  const projectsDir = path.join(process.cwd(), 'public/projects');
  let projectImages: string[] = ['/projects/bg_1.png'];
  try {
    if (fs.existsSync(projectsDir)) {
      const files = fs.readdirSync(projectsDir);
      const filtered = files.filter(file => /\.(png|jpe?g|svg|webp)$/i.test(file));
      if (filtered.length > 0) {
        projectImages = filtered.map(file => `/projects/${file}`);
      }
    }
  } catch (e) {
    console.error("Could not read projects directory", e);
  }

  return (
    <Providers>
      <div className="canvas-content py-2xl px-xl" style={{ maxWidth: '1600px', margin: '0 auto' }}>
      <header className="flex justify-between items-end mb-2xl pb-xl border-b border-outline-variant">
        <div>
            <h1 className="text-editorial text-6xl font-bold tracking-tight">Welcome to your projects</h1>
            <p className="text-secondary mt-sm opacity-70">Select a project to get started.</p>
        </div>
        <div className="flex items-center gap-xl">
            <UserMenu />
        </div>
      </header>
      

      <ProjectGrid className="mb-4xl">
        {activeProjects.map((project: Project) => (
          <ProjectCard key={project.id} project={project} availableImages={projectImages} />
        ))}

        <div className="group relative overflow-hidden rounded-2xl h-full">
            <div className="project-card-image opacity-10" style={{ backgroundImage: `url(${projectImages[0]})` }}></div>
            <div className="project-card-overlay"></div>
            
            <div className="h-full p-2xl transition-all duration-500 relative z-10 rounded-2xl border border-transparent">
                <div className="flex flex-col h-full justify-between">
                    <div className="project-card-content transition-transform duration-500 group-hover:translate-x-1">
                        <div className="w-12 h-1.5 bg-[#f97316] mb-md transition-all duration-500 group-hover:w-full" />
                        <h3 className="text-editorial text-2xl font-bold">Create New Project</h3>
                        <div className="w-full h-px bg-outline-variant mt-sm mb-md" />

                        <form action={handleCreateProject} className="flex flex-col gap-lg">
                            <input 
                                name="name"
                                placeholder="Project Name..."
                                className="input-planner bg-transparent border-none border-b border-outline-variant rounded-none px-0 text-xl font-bold focus:border-primary"
                                required
                            />
                            <Button type="submit" variant="primary" className="h-12 mt-md">
                                Initialize Unit
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
      </ProjectGrid>

      {archivedProjects.length > 0 && (
        <div className="mt-4xl pt-4xl border-t border-outline-variant/30">
          <div className="flex items-center gap-md mb-xl">
            <div className="h-px flex-1 bg-outline-variant/30"></div>
            <h2 className="text-editorial text-xl font-bold opacity-30 uppercase tracking-[0.3em] whitespace-nowrap">Archived Operations</h2>
            <div className="h-px flex-1 bg-outline-variant/30"></div>
          </div>
          
          <ProjectGrid className="grayscale opacity-50 hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            {archivedProjects.map((project: Project) => (
              <ProjectCard key={project.id} project={project} isArchived availableImages={projectImages} />
            ))}
          </ProjectGrid>
        </div>
      )}
      </div>
    </Providers>
  );
}
