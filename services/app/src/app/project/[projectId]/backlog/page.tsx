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
      <div className="board-header">
        <div className="flex flex-col gap-xs">
          <div className="board-header-meta">
            <span>Project Backlog</span>
            <span className="board-header-divider"></span>
            <span className="text-meta text-xs">HIERARCHICAL VIEW</span>
          </div>
          <h2 className="board-title">Strategy Backlog</h2>
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
