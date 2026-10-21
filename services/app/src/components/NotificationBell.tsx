"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AtSign, Bell, CheckCheck, MessageSquare, UserPlus, Repeat } from "lucide-react";
import { getNotifications, markNotificationsRead, type NotificationInfo } from "@/lib/actions";
import { NOTIFICATIONS_CHANGED } from "./realtime/RealtimeProvider";
import { useDismiss } from "./ui/useDismiss";

const POLL_MS = 60_000;

const ICONS: Record<string, React.ReactNode> = {
  MENTION: <AtSign size={14} />,
  COMMENT: <MessageSquare size={14} />,
  ASSIGNED: <UserPlus size={14} />,
  STATUS: <Repeat size={14} />,
};

function timeAgo(iso: string): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

/** Bell with an unread badge and a list of what happened to the things you follow. */
export function NotificationBell({ placement = "up" }: Readonly<{ placement?: "up" | "down" }>) {
  const router = useRouter();
  const [items, setItems] = useState<NotificationInfo[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const ref = useDismiss(open, close);

  const load = useCallback(async () => {
    try {
      const data = await getNotifications(30);
      setItems(data.items);
      setUnread(data.unread);
    } catch { /* signed out or offline: keep what we have */ }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, POLL_MS);
    window.addEventListener(NOTIFICATIONS_CHANGED, load);
    return () => { clearInterval(timer); window.removeEventListener(NOTIFICATIONS_CHANGED, load); };
  }, [load]);

  const openItem = async (n: NotificationInfo) => {
    setOpen(false);
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      void markNotificationsRead([n.id]);
    }
    if (n.projectId) router.push(`/project/${n.projectId}/backlog${n.nodeId ? `?nodeId=${n.nodeId}` : ""}`);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    await markNotificationsRead("all");
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        className="icon-button relative"
        title="Notifications"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell size={16} />
        {unread > 0 && (
          <span data-testid="notification-count" className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-fg">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={`absolute z-[200] w-80 animate-pop-in overflow-hidden rounded-lg border border-border bg-panel shadow-lg ${placement === "up" ? "bottom-full left-0 mb-2" : "right-0 top-full mt-2"}`}
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-sm font-medium">Notifications</p>
            {unread > 0 && (
              <button type="button" onClick={markAll} className="flex items-center gap-1 text-xs text-muted hover:text-fg">
                <CheckCheck size={13} /> Mark all read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">Nothing yet. Mentions and changes to items you follow show up here.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <button type="button" onClick={() => openItem(n)} className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-hover">
                    <span className={`mt-0.5 shrink-0 ${n.read ? "text-faint" : "text-accent"}`}>{ICONS[n.type] ?? <Bell size={14} />}</span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${n.read ? "text-muted" : "font-medium text-fg"}`}>{n.title}</span>
                      <span className="block truncate text-xs text-faint">{n.projectName}</span>
                    </span>
                    <span className="shrink-0 text-xs text-faint" suppressHydrationWarning>{timeAgo(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
