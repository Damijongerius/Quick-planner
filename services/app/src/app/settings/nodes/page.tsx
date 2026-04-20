import { getNodeTypes } from "@/lib/actions";
import { NodeTypeSettings } from "@/components/NodeTypeSettings";

export default async function NodeTypesPage() {
  const nodeTypes = await getNodeTypes();

  return (
    <div style={{ maxWidth: '1200px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Node Types</h2>
        <p style={{ color: '#9ca3af' }}>Define the building blocks of your planning system.</p>
      </header>

      <NodeTypeSettings initialNodeTypes={nodeTypes} />
    </div>
  );
}
