import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getInvitePreview } from "@/lib/actions";
import { InviteCard } from "@/components/InviteCard";
import { Providers } from "@/components/Providers";

export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: Readonly<{ params: Promise<{ token: string }> }>) {
  const { token } = await params;
  const session = await auth();
  if (!session?.user) redirect(`/auth/signin?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);

  const preview = await getInvitePreview(token);

  return (
    <Providers>
      <main className="flex min-h-screen items-center justify-center px-4">
        <InviteCard token={token} preview={preview} signedInAs={session.user.email ?? ""} />
      </main>
    </Providers>
  );
}
