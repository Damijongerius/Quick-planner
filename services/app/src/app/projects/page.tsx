import { getProjects, createProject } from "@/lib/actions";
import Link from "next/link";
import { Plus, Briefcase, Calendar, ChevronRight, LayoutGrid } from "lucide-react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const projects = await getProjects();

  return (
    <div className="canvas-content" style={{ maxWidth: '1000px', margin: '0 auto', paddingTop: '80px' }}>
      <header style={{ marginBottom: '64px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 800, letterSpacing: '-0.05em', marginBottom: '16px' }}>Your Sanctuary</h1>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '18px', fontWeight: 500 }}>
          Select a strategic workspace to continue.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '32px' }}>
        {projects.map((project) => (
          <Link 
            key={project.id} 
            href={`/project/${project.id}/board`}
            style={{ textDecoration: 'none' }}
          >
            <div className="card-sanctuary" style={{ 
                padding: '40px', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
            }}>
                <div>
                    <div style={{ 
                        width: '56px', 
                        height: '56px', 
                        backgroundColor: 'rgba(70, 86, 184, 0.1)', 
                        color: 'var(--primary)', 
                        borderRadius: '16px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        marginBottom: '24px'
                    }}>
                        <Briefcase size={28} />
                    </div>
                    <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '8px' }}>{project.name}</h3>
                    <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: 500 }}>
                        Created {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '14px' }}>
                    Open Workspace <ChevronRight size={16} />
                </div>
            </div>
          </Link>
        ))}

        <form action={async (formData: FormData) => {
            "use server";
            const name = formData.get("name") as string;
            if (name) await createProject(name);
        }}>
            <div className="card-sanctuary" style={{ 
                padding: '40px', 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'center',
                border: '2px dashed var(--outline-variant)',
                background: 'transparent'
            }}>
                <input 
                    name="name"
                    placeholder="Project Name..."
                    required
                    style={{ 
                        background: 'transparent',
                        border: 'none',
                        borderBottom: '2px solid var(--outline-variant)',
                        fontSize: '20px',
                        fontWeight: 700,
                        padding: '8px 0',
                        marginBottom: '24px',
                        outline: 'none',
                        color: 'var(--on-surface)',
                        width: '100%'
                    }}
                />
                <button type="submit" className="button-premium" style={{ width: '100%' }}>
                    <Plus size={20} /> Initialize Project
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
