"use client";

import { ArrowRight, Database } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { AuditLogEvent } from "@/lib/types";
import { prettyHistoryValue } from "@/lib/statusMeta";

const ACTION_META: Record<string, { label: string; color: string }> = {
  CREATE: { label: "Created", color: "var(--success)" },
  UPDATE: { label: "Updated", color: "var(--info)" },
  DELETE: { label: "Deleted", color: "var(--danger)" },
  MOVE: { label: "Moved", color: "var(--accent)" },
  STATUS_CHANGE: { label: "Status", color: "var(--warning)" },
  ASSIGN: { label: "Assigned", color: "var(--accent)" },
  ARCHIVE: { label: "Archived", color: "var(--faint)" },
  RESTORE: { label: "Restored", color: "var(--success)" },
  IMPORT: { label: "Imported", color: "var(--accent)" },
};

const ENTITY_LABEL: Record<string, string> = { NODE: "item", SPRINT: "sprint", PROJECT: "project", NODETYPE: "item type", RELATION: "relation", MEMBER: "member", MILESTONE: "milestone" };

function dayKey(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function HistoryList({ events }: Readonly<{ events: AuditLogEvent[] }>) {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-hover text-faint"><Database size={20} /></div>
        <p className="text-sm font-medium">No activity yet</p>
        <p className="text-sm text-muted">Changes to items, sprints and settings will show up here.</p>
      </div>
    );
  }

  const groups: { day: string; items: AuditLogEvent[] }[] = [];
  for (const event of events) {
    const day = dayKey(new Date(event.createdAt));
    const last = groups[groups.length - 1];
    if (last?.day === day) last.items.push(event);
    else groups.push({ day, items: [event] });
  }

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <section key={group.day}>
          <h2 className="mb-2 text-xs font-medium text-muted" suppressHydrationWarning>{group.day}</h2>
          <ul className="overflow-hidden rounded-lg border border-border bg-panel shadow-sm">
            {group.items.map((event) => {
              const meta = ACTION_META[event.action] ?? { label: event.action, color: "var(--faint)" };
              return (
                <li key={event.id} className="flex items-start gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{meta.label}</span>{" "}
                      <span className="text-muted">{ENTITY_LABEL[event.entityType] ?? event.entityType.toLowerCase()}</span>{" "}
                      <span className="font-medium">{event.entityName}</span>
                    </p>
                    {event.oldValue && event.newValue ? (
                      <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="rounded bg-hover px-1.5 py-0.5 text-muted">{prettyHistoryValue(event.oldValue)}</span>
                        <ArrowRight size={11} className="text-faint" />
                        <span className="rounded bg-accent-soft px-1.5 py-0.5 font-medium text-accent">{prettyHistoryValue(event.newValue)}</span>
                      </p>
                    ) : (
                      event.newValue && <p className="mt-0.5 text-xs text-muted">{prettyHistoryValue(event.newValue)}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-faint">
                    <Avatar src={event.user?.image} name={event.user?.name} size="xs" />
                    <span className="hidden sm:inline">{event.user?.name}</span>
                    <time suppressHydrationWarning>{new Date(event.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</time>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
