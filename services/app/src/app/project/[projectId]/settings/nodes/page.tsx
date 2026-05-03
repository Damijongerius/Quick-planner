import { getNodeTypes } from "@/lib/actions";
import { NodeTypeSettings } from "@/components/NodeTypeSettings";

export default async function NodeTypesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const nodeTypes = await getNodeTypes(projectId);

  return (
    <div className="canvas-content">
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '4px' }}>Nodes</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          Define the building blocks and behavioral rules of your strategic system.
        </p>
      </div>

      <NodeTypeSettings projectId={projectId} initialNodeTypes={nodeTypes} />
    </div>
  );
}
