import { getSprints, getNodeTypes } from "@/lib/actions";
import { SprintPage } from "@/components/SprintPage";

export const dynamic = 'force-dynamic';

export default async function Sprints({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const [sprints, nodeTypes] = await Promise.all([
    getSprints(projectId),
    getNodeTypes(projectId)
  ]);

  return (
    <div className="canvas-content">
    
      <SprintPage projectId={projectId} sprints={sprints} nodeTypes={nodeTypes} />
    </div>
  );
}
