import { getRootNodes, getNodeTypes, getSprints, getAllNodes } from "@/lib/actions";
import { BacklogView } from "@/components/BacklogView";

export const dynamic = 'force-dynamic';

export default async function BacklogPage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const rootNodes = await getRootNodes(projectId);
  const nodeTypes = await getNodeTypes(projectId);
  const sprints = await getSprints(projectId);
  const allNodes = await getAllNodes(projectId);

  return (
    <div className="canvas-content">
      <div className="board-header">
        <div className="flex flex-col gap-sm">
          <h2 className="board-title">Backlog</h2>
        </div>
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
