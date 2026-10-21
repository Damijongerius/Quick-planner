"use server";

import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireProjectAccess, toResult, UserError, type ActionResult } from "./helpers";
import { generateSecret, normalizeEvents, urlPolicyFromEnv, webhookUrlProblem } from "@/lib/webhooks/security";
import { sendTestPing } from "@/lib/webhooks/deliver";

const MAX_WEBHOOKS = 10;

export type WebhookInfo = { id: string; url: string; events: string; active: boolean; lastDeliveryAt: string | null; lastStatus: number | null; lastError: string | null; failureCount: number; createdAt: string };

function page(projectId: string) { revalidatePath(`/project/${projectId}/settings/integrations`); }

/** Webhooks carry a secret and point at outside servers, so only the owner manages them. */
export async function listWebhooks(projectId: string): Promise<WebhookInfo[]> {
  await requireProjectAccess(projectId, { mode: "owner" });
  const rows = await prisma.webhook.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
  return rows.map((w) => ({ id: w.id, url: w.url, events: w.events, active: w.active, lastDeliveryAt: w.lastDeliveryAt?.toISOString() ?? null, lastStatus: w.lastStatus, lastError: w.lastError, failureCount: w.failureCount, createdAt: w.createdAt.toISOString() }));
}

/** The signing secret is returned here once; keep it to verify the signature header on the receiving side. */
export async function createWebhook(projectId: string, url: string, events: string[]): Promise<ActionResult & { secret?: string; id?: string }> {
  const userId = await requireProjectAccess(projectId, { mode: "owner" });
  let secret: string | undefined;
  let id: string | undefined;
  const result = await toResult(async () => {
    const problem = webhookUrlProblem(String(url ?? "").trim(), urlPolicyFromEnv());
    if (problem) throw new UserError(problem);
    if ((await prisma.webhook.count({ where: { projectId } })) >= MAX_WEBHOOKS) throw new UserError(`A project can have up to ${MAX_WEBHOOKS} webhooks.`);
    secret = generateSecret();
    const created = await prisma.webhook.create({ data: { projectId, url: url.trim(), secret, events: normalizeEvents(events), createdById: userId } });
    id = created.id;
  });
  if (!result.error) page(projectId);
  return { ...result, secret, id };
}

export async function updateWebhook(projectId: string, id: string, patch: { active?: boolean; events?: string[]; url?: string }): Promise<ActionResult> {
  await requireProjectAccess(projectId, { mode: "owner" });
  const result = await toResult(async () => {
    const hook = await prisma.webhook.findFirst({ where: { id, projectId } });
    if (!hook) throw new UserError("This webhook no longer exists");
    const data: { active?: boolean; events?: string; url?: string; failureCount?: number } = {};
    if (patch.active !== undefined) { data.active = !!patch.active; if (patch.active) data.failureCount = 0; }
    if (patch.events !== undefined) data.events = normalizeEvents(patch.events);
    if (patch.url !== undefined) {
      const problem = webhookUrlProblem(patch.url.trim(), urlPolicyFromEnv());
      if (problem) throw new UserError(problem);
      data.url = patch.url.trim();
    }
    await prisma.webhook.update({ where: { id }, data });
  });
  if (!result.error) page(projectId);
  return result;
}

export async function rotateWebhookSecret(projectId: string, id: string): Promise<ActionResult & { secret?: string }> {
  await requireProjectAccess(projectId, { mode: "owner" });
  let secret: string | undefined;
  const result = await toResult(async () => {
    const updated = await prisma.webhook.updateMany({ where: { id, projectId }, data: { secret: (secret = generateSecret()) } });
    if (updated.count === 0) throw new UserError("This webhook no longer exists");
  });
  return { ...result, secret: result.error ? undefined : secret };
}

export async function deleteWebhook(projectId: string, id: string): Promise<ActionResult> {
  await requireProjectAccess(projectId, { mode: "owner" });
  await prisma.webhook.deleteMany({ where: { id, projectId } });
  page(projectId);
  return {};
}

/** Sends a `ping` right now and reports what the receiver said. */
export async function testWebhook(projectId: string, id: string): Promise<ActionResult & { status?: number | null }> {
  await requireProjectAccess(projectId, { mode: "owner" });
  let status: number | null = null;
  const result = await toResult(async () => {
    const hook = await prisma.webhook.findFirst({ where: { id, projectId }, include: { project: { select: { name: true } } } });
    if (!hook) throw new UserError("This webhook no longer exists");
    const outcome = await sendTestPing(hook, hook.project.name);
    status = outcome.status;
    if (!outcome.ok) throw new UserError(outcome.error ?? "The receiver did not accept the test");
  });
  page(projectId);
  return { ...result, status };
}
