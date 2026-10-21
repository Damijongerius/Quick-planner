// Plain constants (safe to import from client components).
export const WEBHOOK_EVENTS = ["item.created", "item.updated", "item.status_changed", "item.deleted", "comment.created"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number] | "ping";
