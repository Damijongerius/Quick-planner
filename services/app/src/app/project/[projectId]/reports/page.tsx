import { getSprints, getAllNodes } from "@/lib/actions";
import { ReportsView } from "@/components/reports/ReportsView";

export const dynamic = 'force-dynamic';

export default async function ReportsPage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const [sprints, nodes] = await Promise.all([getSprints(projectId), getAllNodes(projectId)]);

  return (
    <div className="canvas-content">
      <ReportsView nodes={nodes} sprints={sprints} />
    </div>
  );
}
