import { getNodeTypes, getRelations } from "@/lib/actions";
import { RelationEditor } from "@/components/RelationEditor";

export default async function RelationsPage() {
  const nodeTypes = await getNodeTypes();
  const relations = await getRelations();

  return (
    <div style={{ maxWidth: '1200px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Relation Tree</h2>
        <p style={{ color: '#9ca3af' }}>Define how your project nodes connect. Drag from one node to another.</p>
      </header>

      <RelationEditor nodeTypes={nodeTypes} initialRelations={relations} />
      
      <section style={{ marginTop: '48px' }}>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '24px' }}>Active Rules</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {relations.map(rel => (
            <div key={rel.id} className="glass" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontWeight: 600, color: rel.parentNodeType.color || '#fff' }}>{rel.parentNodeType.name}</span>
                <span style={{ color: '#6b7280' }}>→</span>
                <span style={{ fontWeight: 600, color: rel.childNodeTypeType.color || '#fff' }}>{rel.childNodeTypeType.name}</span>
              </div>
            </div>
          ))}
          {relations.length === 0 && (
            <p style={{ color: '#4b5563', fontStyle: 'italic' }}>No relations defined yet. Start by connecting nodes above.</p>
          )}
        </div>
      </section>
    </div>
  );
}
