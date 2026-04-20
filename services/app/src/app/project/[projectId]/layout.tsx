import { Sidebar } from "@/components/Sidebar";
import { TopAppBar } from "@/components/TopAppBar";
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
    <div style={{ display: 'flex' }}>
      <Sidebar project={project} />
      {/* Spacer for fixed sidebar (288px) */}
      <div style={{ width: '288px', flexShrink: 0 }}></div>
      <main className="main-content">
        <TopAppBar projectId={projectId} />
        {children}
      </main>
    </div>
  );
}
