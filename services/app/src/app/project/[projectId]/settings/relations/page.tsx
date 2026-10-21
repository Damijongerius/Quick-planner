import { redirect } from "next/navigation";

// Relations are edited together with item types on one canvas.
export default async function RelationsPage({ params }: Readonly<{ params: Promise<{ projectId: string }> }>) {
  const { projectId } = await params;
  redirect(`/project/${projectId}/settings/nodes`);
}
