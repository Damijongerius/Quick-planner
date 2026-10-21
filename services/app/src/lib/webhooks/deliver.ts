// Server-only. Sends signed events to the URLs a project owner registered. Never throws into the caller:
// a slow or broken receiver must not slow down or break planning.

import { randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import prisma from "@/lib/db";
import { isPrivateAddress, signPayload, subscribesTo, urlPolicyFromEnv, webhookUrlProblem, type WebhookEvent } from "./security";

const TIMEOUT_MS = 8_000;
const RETRY_DELAYS_MS = [1_000, 5_000, 25_000];
const DISABLE_AFTER_FAILURES = 10;

type Hook = { id: string; projectId: string; url: string; secret: string; events: string; active: boolean; failureCount: number };
export interface DeliveryResult { ok: boolean; status: number | null; error: string | null; retryable: boolean }

export interface EventPayload { actorId: string | null; [key: string]: unknown }

/** One attempt. The URL is checked again here because DNS can change after a webhook was saved. */
export async function attemptDelivery(hook: Pick<Hook, "url" | "secret">, event: string, body: string, deliveryId: string): Promise<DeliveryResult> {
  const policy = urlPolicyFromEnv();
  const problem = webhookUrlProblem(hook.url, policy);
  if (problem) return { ok: false, status: null, error: problem, retryable: false };
  try {
    if (!policy.allowPrivate) {
      const host = new URL(hook.url).hostname.replace(/^\[|\]$/g, "");
      const addresses = await lookup(host, { all: true });
      if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) return { ok: false, status: null, error: "The address resolves to a private network", retryable: false };
    }
    const timestamp = String(Math.floor(Date.now() / 1000));
    const response = await fetch(hook.url, {
      method: "POST",
      redirect: "manual", // following a redirect could end up somewhere the check above never saw
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "QuickPlanner-Webhooks/1",
        "X-QuickPlanner-Event": event,
        "X-QuickPlanner-Delivery": deliveryId,
        "X-QuickPlanner-Timestamp": timestamp,
        "X-QuickPlanner-Signature": signPayload(hook.secret, timestamp, body),
      },
      body,
    });
    const ok = response.status >= 200 && response.status < 300;
    return { ok, status: response.status, error: ok ? null : `The receiver answered ${response.status}`, retryable: !ok && (response.status >= 500 || response.status === 429 || response.status === 408) };
  } catch (error) {
    const message = error instanceof Error ? (error.name === "TimeoutError" ? "The receiver took longer than 8 seconds" : error.message) : String(error);
    return { ok: false, status: null, error: message.slice(0, 200), retryable: true };
  }
}

async function record(hookId: string, result: DeliveryResult, final: boolean) {
  const data: Record<string, unknown> = { lastDeliveryAt: new Date(), lastStatus: result.status, lastError: result.error };
  if (result.ok) data.failureCount = 0;
  else if (final) data.failureCount = { increment: 1 };
  const updated = await prisma.webhook.update({ where: { id: hookId }, data }).catch(() => null);
  // A receiver that keeps failing is switched off; the owner can turn it back on.
  if (updated && updated.failureCount >= DISABLE_AFTER_FAILURES && updated.active) await prisma.webhook.update({ where: { id: hookId }, data: { active: false } }).catch(() => {});
}

function envelope(projectId: string, projectName: string, event: string, data: Record<string, unknown>) {
  const id = randomUUID();
  return { id, body: JSON.stringify({ id, event, createdAt: new Date().toISOString(), project: { id: projectId, name: projectName }, data }) };
}

async function deliverWithRetries(hook: Hook, event: string, body: string, id: string, attempt = 1): Promise<void> {
  const result = await attemptDelivery(hook, event, body, id);
  const retry = !result.ok && result.retryable && attempt <= RETRY_DELAYS_MS.length;
  await record(hook.id, result, !retry);
  if (!retry) return;
  const timer = setTimeout(() => {
    void prisma.webhook.findUnique({ where: { id: hook.id } }).then((fresh) => {
      if (fresh?.active) return deliverWithRetries(fresh, event, body, id, attempt + 1);
    }).catch(() => {});
  }, RETRY_DELAYS_MS[attempt - 1]);
  timer.unref?.();
}

/** Fire an event to every active webhook of the project that subscribes to it. Returns immediately. */
export function emitWebhook(projectId: string, event: WebhookEvent, payload: EventPayload): void {
  void (async () => {
    const hooks = await prisma.webhook.findMany({ where: { projectId, active: true } });
    const targets = hooks.filter((h) => subscribesTo(h.events, event));
    if (targets.length === 0) return;
    const [project, actor] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, select: { name: true } }),
      payload.actorId ? prisma.user.findUnique({ where: { id: payload.actorId }, select: { id: true, name: true, email: true } }) : null,
    ]);
    const { actorId: _actorId, ...rest } = payload;
    const { id, body } = envelope(projectId, project?.name ?? "", event, { ...rest, actor: actor ? { id: actor.id, name: actor.name || actor.email } : null });
    await Promise.all(targets.map((hook) => deliverWithRetries(hook, event, body, id)));
  })().catch((error) => console.error("[webhooks] could not emit", event, error));
}

/** Send a `ping` right now and wait for the answer, so the owner sees whether the receiver works. */
export async function sendTestPing(hook: Hook, projectName: string): Promise<DeliveryResult> {
  const { id, body } = envelope(hook.projectId, projectName, "ping", { message: "This is a test from Quick Planner." });
  const result = await attemptDelivery(hook, "ping", body, id);
  await record(hook.id, result, !result.ok);
  return result;
}
