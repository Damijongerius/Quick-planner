import { listWebhooks, getProject } from "@/lib/actions";
import { WebhooksManager } from "@/components/WebhooksManager";
import { appBaseUrl } from "@/lib/mail/config";

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  const project = await getProject(projectId);
  // Only the owner can list webhooks (they carry secrets); everyone else just sees the API part.
  const webhooks = project?.role === "OWNER" ? await listWebhooks(projectId) : [];

  return (
    <div className="canvas-content" style={{ maxWidth: 860 }}>
      <WebhooksManager projectId={projectId} webhooks={webhooks} baseUrl={appBaseUrl()} />
    </div>
  );
}
