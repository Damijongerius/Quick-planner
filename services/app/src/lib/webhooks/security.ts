import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { safeEqual } from "@/lib/api/tokens";

import { WEBHOOK_EVENTS } from "./events";

export { WEBHOOK_EVENTS };
export type { WebhookEvent } from "./events";

export function generateSecret(): string {
  return `whsec_${randomBytes(24).toString("base64url")}`;
}

/** `sha256=<hex>` over "<timestamp>.<body>", so a captured request can't be replayed with a new timestamp. */
export function signPayload(secret: string, timestamp: string, body: string): string {
  return `sha256=${createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex")}`;
}

/** For receivers (and our tests): is the signature valid and the timestamp recent? */
export function verifySignature(secret: string, timestamp: string, body: string, signature: string, now = Date.now(), toleranceMs = 5 * 60_000): boolean {
  if (Math.abs(now - Number(timestamp) * 1000) > toleranceMs) return false;
  return safeEqual(signPayload(secret, timestamp, body), signature);
}

/** Events a webhook subscribes to: "*" or a list; unknown names are dropped. */
export function normalizeEvents(input: string[] | string | undefined): string {
  const list = (Array.isArray(input) ? input : (input ?? "*").split(",")).map((e) => e.trim()).filter(Boolean);
  if (list.length === 0 || list.includes("*")) return "*";
  return [...new Set(list.filter((e) => (WEBHOOK_EVENTS as readonly string[]).includes(e)))].join(",") || "*";
}

export function subscribesTo(events: string, event: string): boolean {
  if (event === "ping") return true;
  return events === "*" || events.split(",").includes(event);
}

/** Addresses a webhook must never be sent to: this machine, private networks, link-local and cloud metadata. */
export function isPrivateAddress(address: string): boolean {
  const kind = isIP(address);
  if (kind === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
  }
  if (kind === 6) {
    const lower = address.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(lower);
    if (mapped) return isPrivateAddress(mapped[1]);
    return /^f[cd]/.test(lower) || /^fe[89ab]/.test(lower);
  }
  return false;
}

export interface UrlPolicy { allowPrivate?: boolean; allowHttp?: boolean }

export function urlPolicyFromEnv(env: Record<string, string | undefined> = process.env): UrlPolicy {
  return { allowPrivate: env.WEBHOOK_ALLOW_PRIVATE === "true", allowHttp: env.WEBHOOK_ALLOW_PRIVATE === "true" || env.WEBHOOK_ALLOW_HTTP === "true" };
}

/** Why a URL can't be used as a webhook target, or null when it is fine. Hostnames are checked again at delivery time. */
export function webhookUrlProblem(raw: string, policy: UrlPolicy = {}): string | null {
  let url: URL;
  try { url = new URL(raw); } catch { return "Enter a full URL, like https://example.com/hooks/planner"; }
  if (url.protocol !== "https:" && !(url.protocol === "http:" && policy.allowHttp)) return "Use an https:// URL.";
  if (url.username || url.password) return "Put credentials in the secret, not in the URL.";
  if (raw.length > 500) return "That URL is too long.";
  if (policy.allowPrivate) return null;
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".") && !isIP(host)) return "That address isn't reachable from the internet.";
  if (isPrivateAddress(host)) return "That address is on a private network, which webhooks can't reach.";
  return null;
}
