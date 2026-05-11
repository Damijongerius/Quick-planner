import { getProjects, createProject } from "@/lib/actions";
import Link from "next/link";
import { Plus, Briefcase, ChevronRight, Sparkles, Terminal } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const projects = await getProjects();

  return (
    <div className="canvas-content py-2xl px-xl" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <header className="flex justify-between items-end mb-2xl pb-xl border-b border-outline-variant">
        <div>
            <div className="flex items-center gap-sm mb-xs opacity-50">
                <Sparkles size={16} className="text-primary" />
                <span className="text-meta text-[10px]">Strategic command center</span>
            </div>
            <h1 className="text-editorial text-6xl font-bold tracking-tight">Your Sanctuary</h1>
            <p className="text-secondary mt-sm opacity-70">Select an operational theater to orchestrate your strategy.</p>
        </div>
        <div className="flex items-center gap-xl">
            <UserMenu />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
        {projects.map((project) => (
          <Link 
            key={project.id} 
            href={`/project/${project.id}/board`}
            className="group no-underline"
          >
            <div className="card-sanctuary glass h-full p-2xl transition-all duration-300 group-hover:-translate-y-2 group-hover:border-primary group-hover:shadow-sanctuary">
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary mb-xl group-hover:scale-110 transition-transform">
                            <Briefcase size={28} />
                        </div>
                        <h3 className="text-editorial text-2xl font-bold mb-xs">{project.name}</h3>
                        <p className="text-meta text-[10px] opacity-40 uppercase tracking-widest">
                            Established {new Date(project.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    
                    <div className="mt-2xl flex items-center gap-sm text-primary font-bold text-xs uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Enter Workspace <ChevronRight size={14} />
                    </div>
                </div>
            </div>
          </Link>
        ))}

        <div className="card-sanctuary bg-surface-container-low border-dashed p-2xl">
            <div className="flex items-center gap-sm mb-lg opacity-40">
                <Terminal size={14} />
                <span className="text-[10px] font-black tracking-widest uppercase">Provision New Theater</span>
            </div>
            <form action={async (formData: FormData) => {
                "use server";
                const name = formData.get("name") as string;
                if (name) await createProject(name);
            }} className="flex flex-col gap-lg">
                <input 
                    name="name"
                    placeholder="Theater Name..."
                    className="input-sanctuary bg-transparent border-none border-b border-outline-variant rounded-none px-0 text-xl font-bold"
                    required
                />
                <Button type="submit" variant="primary" className="h-12">
                    <Plus size={18} /> Initialize Strategic Unit
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}
