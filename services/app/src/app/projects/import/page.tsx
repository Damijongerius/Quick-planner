import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { AccountMenu } from "@/components/AccountMenu";
import { Providers } from "@/components/Providers";
import { ImportWizard } from "@/components/importer/ImportWizard";

export const dynamic = 'force-dynamic';

export default async function ImportProjectPage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  return (
    <Providers>
      <div className="mx-auto min-h-screen max-w-3xl px-6 pb-16">
        <header className="flex items-center justify-between py-5">
          <Link href="/projects" className="flex items-center gap-1.5 text-sm text-muted no-underline hover:text-fg"><ArrowLeft size={15} /> Projects</Link>
          <AccountMenu />
        </header>
        <h1 className="text-2xl font-semibold tracking-tight">Import a project</h1>
        <p className="mb-6 mt-1 text-sm text-muted">Start a new project from a Jira, Linear, Asana or Trello export, a CSV, or a Quick Planner file.</p>
        <ImportWizard projectId={null} people={[]} existingTypes={[]} />
      </div>
    </Providers>
  );
}
