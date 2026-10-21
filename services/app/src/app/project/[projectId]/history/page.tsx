import Link from "next/link";
import { getProjectHistory } from "@/lib/actions";
import { HistoryList } from "@/components/HistoryList";
import { PageHeader } from "@/components/PageHeader";
import { AuditLogEvent } from "@/lib/types";

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 50;

export default async function HistoryPage({ params, searchParams }: Readonly<{
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ before?: string }>;
}>) {
  const { projectId } = await params;
  const { before } = await searchParams;
  // Fetch one extra row to know whether an older page exists.
  const rows = (await getProjectHistory(projectId, { limit: PAGE_SIZE + 1, cursor: before })) as unknown as AuditLogEvent[];
  const hasOlder = rows.length > PAGE_SIZE;
  const history = rows.slice(0, PAGE_SIZE);
  const lastId = history.at(-1)?.id;

  return (
    <div className="canvas-content" style={{ maxWidth: 880 }}>
      <PageHeader title="History" description="A record of every change made in this project." />

      <HistoryList events={history} />

      {(before || hasOlder) && (
        <nav className="mt-5 flex justify-between text-sm font-medium" aria-label="History pages">
          {before ? <Link className="text-accent hover:underline" href={`/project/${projectId}/history`}>← Newest</Link> : <span />}
          {hasOlder && lastId ? <Link className="text-accent hover:underline" href={`/project/${projectId}/history?before=${lastId}`}>Older →</Link> : <span />}
        </nav>
      )}
    </div>
  );
}
