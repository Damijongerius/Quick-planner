import { getRootNodes, getNodeTypes, getSprints, getAllNodes } from "@/lib/actions";
import { BacklogView } from "@/components/BacklogView";

export default async function BacklogPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const rootNodes = await getRootNodes(projectId);
  const nodeTypes = await getNodeTypes(projectId);
  const sprints = await getSprints(projectId);
  const allNodes = await getAllNodes(projectId);

  return (
    <div className="canvas-content">
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '4px' }}>Backlog</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          A simplified, hierarchical view of your strategic objectives and tasks.
        </p>
      </div>

      <BacklogView 
        projectId={projectId}
        rootNodes={rootNodes} 
        nodeTypes={nodeTypes} 
        sprints={sprints} 
        allNodes={allNodes}
      />
    </div>
  );
}
