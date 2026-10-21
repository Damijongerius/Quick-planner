import { getSprints, getNodeTypes, getAllNodes } from "@/lib/actions";
import { PlanningView } from "@/components/planning/PlanningView";

export const dynamic = 'force-dynamic';

export default async function PlanningPage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const [sprints, nodeTypes, nodes] = await Promise.all([getSprints(projectId), getNodeTypes(projectId), getAllNodes(projectId)]);

  return (
    <div className="canvas-content">
      <PlanningView projectId={projectId} nodes={nodes} sprints={sprints} nodeTypes={nodeTypes} />
    </div>
  );
}
