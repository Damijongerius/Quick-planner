import { getRootNodes, getNodeTypes, getSprints, getAllNodes } from "@/lib/actions";
import { BacklogView } from "@/components/BacklogView";

export default async function BacklogPage() {
  const rootNodes = await getRootNodes();
  const nodeTypes = await getNodeTypes();
  const sprints = await getSprints();
  const allNodes = await getAllNodes();

  return (
    <div style={{ maxWidth: '1200px' }}>
      <header style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '8px' }}>Backlog</h2>
        <p style={{ color: '#9ca3af' }}>Your projects and tasks, organized by your rules.</p>
      </header>

      <BacklogView 
        rootNodes={rootNodes} 
        nodeTypes={nodeTypes} 
        sprints={sprints} 
        allNodes={allNodes}
      />
    </div>
  );
}
