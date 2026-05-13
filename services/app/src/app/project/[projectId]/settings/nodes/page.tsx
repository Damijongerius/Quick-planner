import { getNodeTypes, getRelations } from "@/lib/actions";
import { NodeEcosystemEditor } from "@/components/NodeEcosystemEditor";

export default async function NodeArchitecturePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const nodeTypes = await getNodeTypes(projectId);
  const relations = await getRelations(projectId);

  return (
    <div className="canvas-content">
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '4px' }}>Node Architecture</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          Design your nodes. Click types to configure, drag connections to define rules.
        </p>
      </div>

      <NodeEcosystemEditor 
        projectId={projectId} 
        nodeTypes={nodeTypes} 
        initialRelations={relations} 
      />
    </div>
  );
}
