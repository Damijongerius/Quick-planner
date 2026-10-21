"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Link2, Mail, Trash2, UserPlus } from "lucide-react";
import { inviteMember, removeMember, revokeInvite, updateMemberRole } from "@/lib/actions";
import type { InviteInfo, MemberInfo } from "@/lib/actions/members";
import { ROLE_HINT, ROLE_LABEL, INVITABLE_ROLES } from "@/lib/roles";
import { useProject } from "./ProjectContext";
import { PageHeader } from "./PageHeader";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";

const ROLE_OPTIONS = INVITABLE_ROLES.map((r) => ({ value: r, label: ROLE_LABEL[r] }));

function inviteLink(token: string) {
  return `${window.location.origin}/invite/${token}`;
}

export function MembersManager({ projectId, members, invites }: Readonly<{ projectId: string; members: MemberInfo[]; invites: InviteInfo[] }>) {
  const { isOwner, isArchived } = useProject();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("EDITOR");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastInvite, setLastInvite] = useState<{ email: string; link: string; emailed: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      window.prompt("Copy this link:", text);
    }
  };

  const submitInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const result = await inviteMember(projectId, email, role);
    setBusy(false);
    if (result.error || !result.token) {
      setError(result.error ?? "Could not create the invite");
      return;
    }
    setLastInvite({ email: email.trim().toLowerCase(), link: inviteLink(result.token), emailed: !!result.emailed });
    setEmail("");
    router.refresh();
  };

  const changeRole = async (userId: string, newRole: string) => {
    const result = await updateMemberRole(projectId, userId, newRole);
    if (result.error) alert(result.error);
    router.refresh();
  };

  const remove = async (member: MemberInfo) => {
    if (!confirm(`Remove ${member.name || member.email} from this project? Items assigned to them become unassigned.`)) return;
    const result = await removeMember(projectId, member.id);
    if (result.error) alert(result.error);
    router.refresh();
  };

  const revoke = async (invite: InviteInfo) => {
    await revokeInvite(projectId, invite.id);
    router.refresh();
  };

  return (
    <div>
      <PageHeader
        title="Members"
        description={isOwner ? "Invite people to plan together. Everyone sees changes as they happen." : "The people who can open this project."}
      />

      {isOwner && !isArchived && (
        <section className="mb-6 rounded-lg border border-border bg-panel p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold"><UserPlus size={15} /> Invite someone</h2>
          <form onSubmit={submitInvite} className="flex flex-wrap items-start gap-2">
            <div className="min-w-[220px] flex-1">
              <label htmlFor="invite-email" className="sr-only">Email address</label>
              <input id="invite-email" type="email" required className="input-planner" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div style={{ width: 130 }}><Select options={ROLE_OPTIONS} value={role} onChange={setRole} /></div>
            <Button type="submit" loading={busy} icon={<Mail size={14} />}>Send invite</Button>
          </form>
          <p className="mt-2 text-xs text-muted">{ROLE_HINT[role === "VIEWER" ? "VIEWER" : "EDITOR"]}</p>
          {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}

          {lastInvite && (
            <div className="mt-3 rounded-md border border-success/30 bg-success-soft p-3 text-sm" role="status">
              <p className="font-medium text-success">Invite created for {lastInvite.email}</p>
              <p className="mt-1 text-xs text-muted">{lastInvite.emailed ? "We emailed them the invitation. " : ""}They join automatically when they sign in with that email, or you can send them this link:</p>
              <div className="mt-2 flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded bg-panel px-2 py-1 text-xs">{lastInvite.link}</code>
                <Button size="sm" variant="secondary" onClick={() => copy(lastInvite.link, "last")} icon={copied === "last" ? <Check size={13} /> : <Copy size={13} />}>
                  {copied === "last" ? "Copied" : "Copy link"}
                </Button>
              </div>
            </div>
          )}
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-medium text-muted">People <span className="text-xs text-faint">{members.length}</span></h2>
        <ul className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
          {members.map((m) => (
            <li key={m.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
              <Avatar src={m.image} name={m.name} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{m.name || m.email}{m.isYou && <span className="ml-1.5 text-xs font-normal text-faint">(you)</span>}</p>
                {m.name && <p className="truncate text-xs text-muted">{m.email}</p>}
              </div>
              {isOwner && m.role !== "OWNER" ? (
                <>
                  <div style={{ width: 120 }}><Select options={ROLE_OPTIONS} value={m.role} onChange={(v) => changeRole(m.id, v)} /></div>
                  <button onClick={() => remove(m)} className="icon-button hover:!text-danger" aria-label={`Remove ${m.name || m.email}`}><Trash2 size={15} /></button>
                </>
              ) : (
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.role === "OWNER" ? "bg-accent-soft text-accent" : "bg-hover text-muted"}`}>{ROLE_LABEL[m.role]}</span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isOwner && invites.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-medium text-muted">Pending invites <span className="text-xs text-faint">{invites.length}</span></h2>
          <ul className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3 last:border-b-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-hover text-faint"><Mail size={14} /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{i.email}</p>
                  <p className="text-xs text-muted">{ROLE_LABEL[i.role]} · invited by {i.invitedByName}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => copy(inviteLink(i.token), i.id)} icon={copied === i.id ? <Check size={13} /> : <Link2 size={13} />}>
                  {copied === i.id ? "Copied" : "Copy link"}
                </Button>
                <button onClick={() => revoke(i)} className="icon-button hover:!text-danger" aria-label={`Revoke invite for ${i.email}`}><Trash2 size={15} /></button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
