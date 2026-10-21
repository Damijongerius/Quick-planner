"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, KeyRound, Trash2 } from "lucide-react";
import { createApiToken, revokeApiToken, type TokenInfo } from "@/lib/actions";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }) : "never");

/** Personal API tokens: create one, copy it (shown once), revoke when done. */
export function ApiTokens({ tokens }: Readonly<{ tokens: TokenInfo[] }>) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [readOnly, setReadOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fresh, setFresh] = useState<{ name: string; token: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const result = await createApiToken(name, readOnly);
    setBusy(false);
    if (result.error || !result.token) { setError(result.error ?? "Couldn't create the token."); return; }
    setFresh({ name, token: result.token });
    setName("");
    router.refresh();
  };

  const copy = async () => {
    if (!fresh) return;
    try { await navigator.clipboard.writeText(fresh.token); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt("Copy this token:", fresh.token); }
  };

  const revoke = async (t: TokenInfo) => {
    if (!confirm(`Revoke “${t.name}”? Anything using it stops working immediately.`)) return;
    await revokeApiToken(t.id);
    router.refresh();
  };

  return (
    <div className="p-4">
      <div className="flex items-center gap-2">
        <KeyRound size={15} className="text-muted" />
        <p className="text-sm font-medium">API tokens</p>
      </div>
      <p className="mt-1 text-xs text-muted">Let scripts and other tools read and change your projects. A token can do whatever you can do, so keep it secret. <a className="underline" href="/api/v1/openapi.json">API description</a></p>

      {fresh && (
        <div role="status" className="mt-3 rounded-md border border-success/30 bg-success-soft p-3 text-sm">
          <p className="font-medium text-success">Token “{fresh.name}” created. Copy it now; you won&apos;t see it again.</p>
          <div className="mt-2 flex items-center gap-2">
            <code data-testid="new-token" className="min-w-0 flex-1 truncate rounded bg-panel px-2 py-1 text-xs">{fresh.token}</code>
            <Button size="sm" variant="secondary" onClick={copy} icon={copied ? <Check size={13} /> : <Copy size={13} />}>{copied ? "Copied" : "Copy"}</Button>
          </div>
        </div>
      )}

      <form onSubmit={create} className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="token-name" className="sr-only">Token name</label>
        <Input id="token-name" className="!w-56" placeholder="Name, e.g. CI script" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
        <label className="flex items-center gap-1.5 text-sm text-muted"><input type="checkbox" checked={readOnly} onChange={(e) => setReadOnly(e.target.checked)} /> Read-only</label>
        <Button type="submit" size="sm" loading={busy}>Create token</Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger" role="alert">{error}</p>}

      {tokens.length > 0 && (
        <ul className="mt-3 divide-y divide-border rounded-md border border-border">
          {tokens.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{t.name}{t.readOnly && <span className="ml-2 rounded-full bg-hover px-1.5 py-0.5 text-xs font-normal text-muted">read-only</span>}</span>
                <span className="block text-xs text-muted"><code>{t.prefix}…</code> · created {fmt(t.createdAt)} · last used {fmt(t.lastUsedAt)}</span>
              </span>
              <button type="button" className="icon-button hover:!text-danger" aria-label={`Revoke ${t.name}`} onClick={() => revoke(t)}><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
