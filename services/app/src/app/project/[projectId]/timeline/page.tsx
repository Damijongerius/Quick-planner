import { getSprints, getNodeTypes, getAllNodes, getMilestones } from "@/lib/actions";
import { BoardView } from "@/components/BoardView";

export const dynamic = 'force-dynamic';

export default async function TimelinePage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const [sprints, nodeTypes, allNodes, milestones] = await Promise.all([getSprints(projectId), getNodeTypes(projectId), getAllNodes(projectId), getMilestones(projectId)]);

  return (
    <div className="canvas-content">
      <BoardView
        mode="GANTT"
        projectId={projectId}
        initialSprints={sprints}
        initialNodeTypes={nodeTypes}
        initialNodes={allNodes}
        milestones={milestones}
        initialActiveSprintId={null}
      />
    </div>
  );
}
