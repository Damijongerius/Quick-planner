import { getNodeTypes, getRelations } from "@/lib/actions";
import { NodeEcosystemEditor } from "@/components/NodeEcosystemEditor";

export const dynamic = 'force-dynamic';

export default async function ItemTypesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const nodeTypes = await getNodeTypes(projectId);
  const relations = await getRelations(projectId);

  return (
    <div className="canvas-content">
      <NodeEcosystemEditor 
        projectId={projectId} 
        nodeTypes={nodeTypes} 
        initialRelations={relations} 
      />
    </div>
  );
}
