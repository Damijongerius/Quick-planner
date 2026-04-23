import { getSprints, getNodeTypes, getAllNodes } from "@/lib/actions";
import { BoardView } from "@/components/BoardView";

export default async function BoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const sprints = await getSprints(projectId);
  const nodeTypes = await getNodeTypes(projectId);
  const allNodes = await getAllNodes(projectId);

  // Find active sprint
  const activeSprint = sprints.find((s: any) => s.status === 'ACTIVE') || sprints[0];

  return (
    <div className="canvas-content">
      <BoardView 
        projectId={projectId}
        initialSprints={sprints} 
        initialNodeTypes={nodeTypes} 
        initialNodes={allNodes}
        initialActiveSprintId={activeSprint?.id}
      />
    </div>
  );
}
