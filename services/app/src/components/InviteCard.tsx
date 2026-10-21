"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Users } from "lucide-react";
import { acceptInvite } from "@/lib/actions";
import type { InvitePreview } from "@/lib/actions/members";
import { ROLE_HINT, ROLE_LABEL } from "@/lib/roles";
import { Button } from "./ui/Button";

export function InviteCard({ token, preview, signedInAs }: Readonly<{ token: string; preview: InvitePreview | null; signedInAs: string }>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const accept = async () => {
    setBusy(true);
    setError("");
    const result = await acceptInvite(token);
    if (result.error || !result.projectId) {
      setError(result.error ?? "Could not accept the invite");
      setBusy(false);
      return;
    }
    router.push(`/project/${result.projectId}/board`);
  };

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-panel p-8 text-center shadow-lg">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft text-accent"><Users size={22} /></div>

      {!preview ? (
        <>
          <h1 className="text-xl font-semibold">Invite not found</h1>
          <p className="mt-2 text-sm text-muted">This link is invalid or was already used. Ask the project owner for a new one.</p>
          <Link href="/projects" className="button-base button-secondary button-md mt-6 w-full">Go to my projects</Link>
        </>
      ) : preview.alreadyMember ? (
        <>
          <h1 className="text-xl font-semibold">You&apos;re already in {preview.projectName}</h1>
          <Link href={`/project/${preview.projectId}/board`} className="button-base button-primary button-md mt-6 w-full">Open project</Link>
        </>
      ) : preview.expired ? (
        <>
          <h1 className="text-xl font-semibold">This invite has expired</h1>
          <p className="mt-2 text-sm text-muted">Ask {preview.invitedBy ?? "the project owner"} to send a new one.</p>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Join {preview.projectName}</h1>
          <p className="mt-2 text-sm text-muted">{preview.invitedBy ?? "Someone"} invited you as <strong className="text-fg">{ROLE_LABEL[preview.role]}</strong>. {ROLE_HINT[preview.role]}</p>

          {!preview.emailMatches && (
            <p className="mt-4 rounded-md bg-warning-soft px-3 py-2 text-left text-sm text-warning" role="alert">
              This invite is for <strong>{preview.email}</strong>, but you&apos;re signed in as {signedInAs || "another account"}.
            </p>
          )}
          {error && <p className="mt-4 text-sm text-danger" role="alert">{error}</p>}

          {preview.emailMatches ? (
            <Button className="mt-6 w-full" size="lg" loading={busy} onClick={accept}>Accept invite</Button>
          ) : (
            <Button className="mt-6 w-full" size="lg" variant="secondary" onClick={() => signOut({ callbackUrl: `/invite/${token}` })}>Switch account</Button>
          )}
        </>
      )}
    </div>
  );
}
