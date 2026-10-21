import { prettyHistoryValue } from "./statusMeta";

type HistoryLike = { action: string; entityType: string; entityName?: string | null; oldValue?: string | null; newValue?: string | null };

/** One-line description of a history event as it appears in an item's activity ("changed status from To do to Done"). */
export function describeEvent(e: HistoryLike): string {
  const from = e.oldValue ? prettyHistoryValue(e.oldValue) : null;
  const to = e.newValue ? prettyHistoryValue(e.newValue) : null;
  switch (e.action) {
    case "CREATE": return "created this item";
    case "STATUS_CHANGE": return from && to ? `changed the status from ${from} to ${to}` : "changed the status";
    case "ASSIGN": return to && to !== "Unassigned" ? `assigned this to ${to}` : "unassigned this item";
    case "MOVE": return to ? `moved this to ${to}` : "moved this item";
    case "ARCHIVE": return "archived this item";
    case "RESTORE": return "restored this item";
    case "DELETE": return "deleted this item";
    case "UPDATE":
      if (from && to) return `changed “${from}” to “${to}”`;
      return "updated this item";
    default: return e.action.toLowerCase();
  }
}

export type ActivityEntry =
  | { kind: "comment"; id: string; at: string; user: { name: string | null; image: string | null }; body: string; canDelete: boolean }
  | { kind: "event"; id: string; at: string; user: { name: string | null; image: string | null }; text: string };

/** Comments and history events as one chronological list (oldest first). */
export function mergeActivity(comments: { id: string; body: string; createdAt: string; user: { name: string | null; email?: string | null; image: string | null }; canDelete: boolean }[], events: (HistoryLike & { id: string; createdAt: string | Date; user?: { name: string | null; image: string | null } | null })[]): ActivityEntry[] {
  const entries: ActivityEntry[] = [
    ...comments.map((c): ActivityEntry => ({ kind: "comment", id: `c-${c.id}`, at: new Date(c.createdAt).toISOString(), user: { name: c.user.name || c.user.email || null, image: c.user.image }, body: c.body, canDelete: c.canDelete })),
    ...events.map((h): ActivityEntry => ({ kind: "event", id: `h-${h.id}`, at: new Date(h.createdAt).toISOString(), user: { name: h.user?.name ?? null, image: h.user?.image ?? null }, text: describeEvent(h) })),
  ];
  return entries.sort((a, b) => a.at.localeCompare(b.at));
}
