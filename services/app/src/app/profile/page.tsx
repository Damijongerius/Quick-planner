import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EmailPreference } from "@/components/EmailPreference";
import prisma from "@/lib/db";
import { getEmailPreference, listApiTokens } from "@/lib/actions";
import { ApiTokens } from "@/components/ApiTokens";
import { mailConfig } from "@/lib/mail/config";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");

  const { name, email, image } = session.user;
  const [emailOn, tokens, accounts] = await Promise.all([
    getEmailPreference(),
    listApiTokens(),
    prisma.account.findMany({ where: { userId: session.user.id }, select: { provider: true } }),
  ]);
  const providers = accounts.map((a) => ({ google: "Google", github: "GitHub" }[a.provider] ?? a.provider));
  const signedInWith = providers.length > 0 ? providers.join(" and ") : "email";

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-6 py-10">
      <Link href="/projects" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft size={14} /> Projects
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

      <section className="mt-6 flex items-center gap-4 rounded-lg border border-border bg-panel p-5 shadow-sm">
        <Avatar src={image} name={name} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{name || "Unnamed user"}</p>
          <p className="truncate text-sm text-muted">{email}</p>
          <p className="mt-1 text-xs text-faint">Signed in with {signedInWith}</p>
          
        </div>
      </section>

      <section className="mt-4 divide-y divide-border rounded-lg border border-border bg-panel shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-medium">Appearance</p>
            <p className="text-xs text-muted">Click to cycle between system, light and dark.</p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-between gap-4 p-4">
          <div>
            <p className="text-sm font-medium">Email notifications</p>
            <p className="text-xs text-muted">{mailConfig() ? "Get an email when you're mentioned or assigned something while you're away from the app." : "Email isn't set up on this server, so there is nothing to send. In-app notifications still work."}</p>
          </div>
          <EmailPreference initial={emailOn} disabled={!mailConfig()} />
        </div>
        <ApiTokens tokens={tokens} />
      </section>
    </div>
  );
}
