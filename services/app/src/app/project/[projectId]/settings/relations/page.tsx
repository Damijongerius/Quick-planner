import { getNodeTypes, getRelations } from "@/lib/actions";
import { RelationEditor } from "@/components/RelationEditor";

export default async function RelationsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const nodeTypes = await getNodeTypes(projectId);
  const relations = await getRelations(projectId);

  return (
    <div className="canvas-content">
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '4px' }}>Node Relations</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          Define how your strategic nodes connect and flow. Drag from the bottom handle to the top handle.
        </p>
      </div>

      <RelationEditor projectId={projectId} nodeTypes={nodeTypes} initialRelations={relations} />
      
      <section style={{ marginTop: '64px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(89, 96, 100, 0.4)', marginBottom: '24px' }}>Active Governance Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {relations.map(rel => (
            <div key={rel.id} className="card-sanctuary" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: rel.parentNodeType.color || 'var(--primary)' }}>{rel.parentNodeType.name}</span>
                <span style={{ color: 'var(--outline-variant)', fontWeight: 300 }}>→</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: rel.childNodeTypeType.color || 'var(--primary)' }}>{rel.childNodeTypeType.name}</span>
              </div>
            </div>
          ))}
          {relations.length === 0 && (
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontStyle: 'italic' }}>No relations defined yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
