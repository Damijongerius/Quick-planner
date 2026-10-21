import { getSprints, getNodeTypes, getAllNodes } from "@/lib/actions";
import { BoardView } from "@/components/BoardView";

export const dynamic = 'force-dynamic';

export default async function BoardPage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const sprints = await getSprints(projectId);
  const nodeTypes = await getNodeTypes(projectId);
  const allNodes = await getAllNodes(projectId);

  // Open on the active sprint; otherwise the next planned one, otherwise the most recent.
  const activeSprint = sprints.find((s) => s.status === 'ACTIVE') || sprints.find((s) => s.status === 'PLANNED') || sprints[sprints.length - 1];

  return (
    <div className="canvas-content">
      <BoardView 
        mode="KANBAN"
        projectId={projectId}
        initialSprints={sprints} 
        initialNodeTypes={nodeTypes} 
        initialNodes={allNodes}
        initialActiveSprintId={activeSprint?.id}
      />
    </div>
  );
}
