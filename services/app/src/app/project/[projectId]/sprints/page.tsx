import { getSprints } from "@/lib/actions";
import { SprintPage } from "@/components/SprintPage";

export default async function Sprints({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const sprints = await getSprints(projectId);

  return (
    <div className="canvas-content">
      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: '4px' }}>Strategic Cycles</h2>
        <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px' }}>
          Orchestrate your development cycles and roadmap milestones.
        </p>
      </div>
      
      <SprintPage projectId={projectId} sprints={sprints} />
    </div>
  );
}
