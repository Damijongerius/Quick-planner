import { getNodeTypes, getProjectMembers, listTemplates } from "@/lib/actions";
import { DataPanel } from "@/components/importer/DataPanel";

export const dynamic = 'force-dynamic';

export default async function DataPage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const [types, members, templates] = await Promise.all([getNodeTypes(projectId), getProjectMembers(projectId), listTemplates()]);

  return (
    <div className="canvas-content" style={{ maxWidth: 860 }}>
      <DataPanel
        projectId={projectId}
        people={members.map((m) => ({ email: m.email, name: m.name }))}
        existingTypes={types.map((t) => t.name)}
        myTemplates={templates.filter((t) => !t.builtIn)}
      />
    </div>
  );
}
