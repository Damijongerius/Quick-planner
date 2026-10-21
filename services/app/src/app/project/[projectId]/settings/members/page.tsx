import { getPendingInvites, getProjectMembers } from "@/lib/actions";
import { MembersManager } from "@/components/MembersManager";

export const dynamic = 'force-dynamic';

export default async function MembersPage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const [members, invites] = await Promise.all([getProjectMembers(projectId), getPendingInvites(projectId)]);

  return (
    <div className="canvas-content" style={{ maxWidth: 860 }}>
      <MembersManager projectId={projectId} members={members} invites={invites} />
    </div>
  );
}
