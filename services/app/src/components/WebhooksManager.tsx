"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Send, Trash2, Webhook as WebhookIcon } from "lucide-react";
import { createWebhook, deleteWebhook, testWebhook, updateWebhook, type WebhookInfo } from "@/lib/actions";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";
import { useProject } from "./ProjectContext";
import { PageHeader } from "./PageHeader";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Switch } from "./ui/Switch";

const EVENT_LABEL: Record<string, string> = {
  "item.created": "Item created", "item.updated": "Item changed", "item.status_changed": "Status changed", "item.deleted": "Item deleted", "comment.created": "Comment added",
};

function Section({ title, hint, children }: Readonly<{ title: string; hint?: string; children: React.ReactNode }>) {
  return (
    <section className="rounded-lg border border-border bg-panel p-5">
      <h2 className="text-base font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function WebhooksManager({ projectId, webhooks, baseUrl }: Readonly<{ projectId: string; webhooks: WebhookInfo[]; baseUrl: string }>) {
  const { isOwner } = useProject();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; text: string } | null>(null);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError("");
    const result = await createWebhook(projectId, url, events);
    setBusy(false);
    if (result.error || !result.secret) { setError(result.error ?? "Couldn't create the webhook."); return; }
    setSecret(result.secret); setUrl(""); setEvents([]);
    router.refresh();
  };

  const test = async (w: WebhookInfo) => {
    setTesting(w.id); setTestResult(null);
    const result = await testWebhook(projectId, w.id);
    setTesting(null);
    setTestResult({ id: w.id, ok: !result.error, text: result.error ?? `The receiver answered ${result.status}.` });
    router.refresh();
  };

  const remove = async (w: WebhookInfo) => {
    if (!confirm(`Delete the webhook for ${w.url}?`)) return;
    await deleteWebhook(projectId, w.id);
    router.refresh();
  };

  const copySecret = async () => {
    if (!secret) return;
    try { await navigator.clipboard.writeText(secret); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { window.prompt("Copy this secret:", secret); }
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      <PageHeader title="Integrations" description="Connect Quick Planner to your other tools." />

      <Section title="API" hint="Read and change this project from scripts, spreadsheets or other apps. Create a personal token on your Account page.">
        <pre className="overflow-x-auto rounded-md bg-hover p-3 text-xs"><code>{`curl -H "Authorization: Bearer qp_…" \\\n  ${baseUrl}/api/v1/projects/${projectId}/items?status=TODO`}</code></pre>
        <p className="mt-2 text-sm"><a className="underline" href="/api/v1/openapi.json">OpenAPI description</a> · 120 requests per minute per token</p>
      </Section>

      <Section title="Webhooks" hint="We send a signed POST to your URL when something changes here, so other systems can react instantly.">
        {!isOwner ? (
          <p className="text-sm text-muted">Only the project owner can manage webhooks.</p>
        ) : (
          <>
            {secret && (
              <div role="status" className="mb-4 rounded-md border border-success/30 bg-success-soft p-3 text-sm">
                <p className="font-medium text-success">Webhook created. Copy the signing secret now; you won&apos;t see it again.</p>
                <div className="mt-2 flex items-center gap-2">
                  <code data-testid="webhook-secret" className="min-w-0 flex-1 truncate rounded bg-panel px-2 py-1 text-xs">{secret}</code>
                  <Button size="sm" variant="secondary" onClick={copySecret} icon={copied ? <Check size={13} /> : <Copy size={13} />}>{copied ? "Copied" : "Copy"}</Button>
                </div>
                <p className="mt-2 text-xs text-muted">Each request carries <code>X-QuickPlanner-Signature: sha256=…</code>, the HMAC-SHA256 of <code>{"{timestamp}.{body}"}</code> with this secret. Reject requests whose signature or timestamp doesn&apos;t check out.</p>
              </div>
            )}

            <form onSubmit={create} className="flex flex-col gap-3">
              <div>
                <label htmlFor="webhook-url" className="form-field-label">Payload URL</label>
                <Input id="webhook-url" className="mt-1" type="url" placeholder="https://example.com/hooks/planner" value={url} onChange={(e) => setUrl(e.target.value)} required />
              </div>
              <fieldset>
                <legend className="form-field-label">Events <span className="font-normal text-faint">(none selected = all)</span></legend>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {WEBHOOK_EVENTS.map((ev) => (
                    <label key={ev} className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-xs">
                      <input type="checkbox" checked={events.includes(ev)} onChange={() => setEvents((cur) => (cur.includes(ev) ? cur.filter((x) => x !== ev) : [...cur, ev]))} /> {EVENT_LABEL[ev]}
                    </label>
                  ))}
                </div>
              </fieldset>
              {error && <p className="text-sm text-danger" role="alert">{error}</p>}
              <div><Button type="submit" loading={busy} icon={<WebhookIcon size={14} />}>Add webhook</Button></div>
            </form>

            {webhooks.length > 0 && (
              <ul className="mt-5 divide-y divide-border rounded-md border border-border">
                {webhooks.map((w) => (
                  <li key={w.id} className="flex flex-col gap-1.5 px-3 py-3 text-sm">
                    <div className="flex items-center gap-3">
                      <span className="min-w-0 flex-1 truncate font-medium" title={w.url}>{w.url}</span>
                      <Switch checked={w.active} label={`Webhook ${w.url} active`} onChange={async (active) => { await updateWebhook(projectId, w.id, { active }); router.refresh(); }} />
                      <Button size="sm" variant="secondary" loading={testing === w.id} onClick={() => test(w)} icon={<Send size={13} />}>Send test</Button>
                      <button type="button" className="icon-button hover:!text-danger" aria-label={`Delete webhook ${w.url}`} onClick={() => remove(w)}><Trash2 size={14} /></button>
                    </div>
                    <p className="text-xs text-muted">
                      {w.events === "*" ? "All events" : w.events.split(",").map((e) => EVENT_LABEL[e] ?? e).join(", ")}
                      {w.lastDeliveryAt ? ` · last delivery ${new Date(w.lastDeliveryAt).toLocaleString()} (${w.lastStatus ?? "no response"})` : " · nothing delivered yet"}
                    </p>
                    {!w.active && w.failureCount >= 10 && <p className="text-xs text-warning">Switched off after repeated failures. Fix the receiver, then turn it back on.</p>}
                    {w.lastError && <p className="text-xs text-danger">Last error: {w.lastError}</p>}
                    {testResult?.id === w.id && <p role="status" className={`text-xs ${testResult.ok ? "text-success" : "text-danger"}`}>{testResult.text}</p>}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Section>
    </div>
  );
}
