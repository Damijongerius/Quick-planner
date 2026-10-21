"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { Peer, RealtimeEvent } from "@/lib/realtime/hub";
import { useProject } from "../ProjectContext";

/** `resync` is synthetic: the connection came back after a gap, so anything open should re-check the server. */
export type ChangedEvent = Extract<RealtimeEvent, { type: "changed" }> & { resync?: boolean };
type Status = "connecting" | "live" | "offline";
type PresencePatch = { viewing?: string | null; editing?: string | null };

interface RealtimeValue {
  status: Status;
  /** Everyone else who is in the project right now. */
  peers: Peer[];
  /** Others who have this item open (editing ones included). */
  peersFor: (nodeId: string) => Peer[];
  /** Tell others what you have open / are typing into. */
  setPresence: (patch: PresencePatch) => void;
  /** Be told about changes teammates make. Returns the unsubscribe function. */
  subscribe: (listener: (event: ChangedEvent) => void) => () => void;
}

const NOOP: RealtimeValue = {
  status: "offline",
  peers: [],
  peersFor: () => [],
  setPresence: () => {},
  subscribe: () => () => {},
};

const RealtimeContext = createContext<RealtimeValue>(NOOP);

/** Safe anywhere: outside a project it simply reports nobody else. */
export function useRealtime(): RealtimeValue {
  return useContext(RealtimeContext);
}

/** Fired on the window when a notification arrives or is read, so the bell can refetch. */
export const NOTIFICATIONS_CHANGED = "qp:notifications-changed";

const REFRESH_DEBOUNCE_MS = 350;
const OFFLINE_POLL_MS = 20_000;
/** The server pings every 15s; this much silence means the connection is dead even if the browser hasn't noticed. */
const WATCHDOG_MS = 40_000;

function pageFromPath(pathname: string): string | null {
  const rest = pathname.split("/").slice(3).join("/"); // /project/:id/<rest>
  if (rest.startsWith("settings/members")) return "members";
  if (rest.startsWith("settings/nodes")) return "nodes";
  const first = rest.split("/")[0];
  return ["board", "backlog", "timeline", "sprints", "history", "planning", "reports"].includes(first) ? first : null;
}

/** A card or bar is being dragged: refreshing now would yank it out of the user's hand. */
function isDragging(): boolean {
  return !!document.querySelector("[data-rfd-draggable-id][style*='position: fixed']");
}

export function RealtimeProvider({ projectId, children }: Readonly<{ projectId: string; children: React.ReactNode }>) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUserId } = useProject();
  const [status, setStatus] = useState<Status>("connecting");
  const [allPeers, setAllPeers] = useState<Peer[]>([]);
  const [attempt, setAttempt] = useState(0);

  const clientId = useRef<string | null>(null);
  const presence = useRef<{ page: string | null; viewing: string | null; editing: string | null }>({ page: pageFromPath(pathname), viewing: null, editing: null });
  const listeners = useRef(new Set<(event: ChangedEvent) => void>());
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hadConnection = useRef(false);
  const lastMessageAt = useRef(0); // set when a connection opens

  const scheduleRefresh = useCallback(() => {
    if (refreshTimer.current) return;
    const run = () => {
      refreshTimer.current = null;
      // A refresh that fails makes Next.js hard-reload the page, which on a dead network leaves a blank screen.
      // Wait for the connection; coming back online reconnects, refreshes and resyncs anyway.
      if (!navigator.onLine) return;
      if (isDragging()) {
        refreshTimer.current = setTimeout(run, 800);
        return;
      }
      router.refresh();
    };
    refreshTimer.current = setTimeout(run, REFRESH_DEBOUNCE_MS);
  }, [router]);

  const flushPresence = useCallback(() => {
    sendTimer.current = null;
    if (!clientId.current) return;
    fetch(`/api/projects/${projectId}/presence`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: clientId.current, ...presence.current }),
      keepalive: true,
    })
      .then((res) => { if (res.status === 410) setAttempt((n) => n + 1); }) // the server forgot us: reconnect
      .catch(() => { /* offline: the next heartbeat/reconnect resends */ });
  }, [projectId]);

  const queuePresence = useCallback(() => {
    if (sendTimer.current) clearTimeout(sendTimer.current);
    sendTimer.current = setTimeout(flushPresence, 150);
  }, [flushPresence]);

  const setPresence = useCallback((patch: PresencePatch) => {
    presence.current = { ...presence.current, ...patch };
    queuePresence();
  }, [queuePresence]);

  // Keep "where am I" in step with navigation.
  useEffect(() => {
    presence.current = { ...presence.current, page: pageFromPath(pathname) };
    queuePresence();
  }, [pathname, queuePresence]);

  useEffect(() => {
    const source = new EventSource(`/api/projects/${projectId}/events`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("connecting");

    const touch = () => { lastMessageAt.current = Date.now(); };
    for (const name of ["hello", "presence", "changed", "ping", "notification"]) source.addEventListener(name, touch);
    source.addEventListener("hello", (e) => {
      const data = JSON.parse((e as MessageEvent).data) as { clientId: string };
      clientId.current = data.clientId;
      setStatus("live");
      // After a dropped connection we may have missed changes.
      if (hadConnection.current) {
        router.refresh();
        listeners.current.forEach((listener) => listener({ type: "changed", scope: "nodes", by: "", resync: true }));
      }
      hadConnection.current = true;
      flushPresence();
    });
    source.addEventListener("presence", (e) => {
      setAllPeers((JSON.parse((e as MessageEvent).data) as { peers: Peer[] }).peers);
    });
    source.addEventListener("changed", (e) => {
      const event = JSON.parse((e as MessageEvent).data) as ChangedEvent;
      listeners.current.forEach((listener) => listener(event));
      if (event.by !== currentUserId) scheduleRefresh();
    });
    source.addEventListener("notification", () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED)));
    source.addEventListener("kicked", () => {
      source.close();
      router.replace("/projects");
    });
    source.addEventListener("limit", () => {
      source.close();
      setStatus("offline");
    });
    source.onerror = () => setStatus("offline"); // EventSource retries on its own

    // The browser knows when the network goes away or returns; don't wait for the stream to notice.
    const onOffline = () => setStatus("offline");
    const onOnline = () => setAttempt((n) => n + 1); // reconnect now (and resync on hello)
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    // Silent death (laptop sleep, dropped wifi): no heartbeat for a while means reconnect.
    lastMessageAt.current = Date.now();
    const watchdog = setInterval(() => {
      if (Date.now() - lastMessageAt.current > WATCHDOG_MS) {
        setStatus("offline");
        setAttempt((n) => n + 1);
      }
    }, 10_000);

    return () => {
      source.close();
      clientId.current = null;
      clearInterval(watchdog);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, [projectId, attempt, currentUserId, router, scheduleRefresh, flushPresence]);

  // While the live connection is down, fall back to polling so people still see each other's work.
  useEffect(() => {
    if (status !== "offline") return;
    const timer = setInterval(() => { if (document.visibilityState === "visible") scheduleRefresh(); }, OFFLINE_POLL_MS);
    return () => clearInterval(timer);
  }, [status, scheduleRefresh]);

  useEffect(() => () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (sendTimer.current) clearTimeout(sendTimer.current);
  }, []);

  const value = useMemo<RealtimeValue>(() => {
    const peers = allPeers.filter((p) => p.userId !== currentUserId);
    return {
      status,
      peers,
      peersFor: (nodeId) => peers.filter((p) => p.viewing === nodeId || p.editing === nodeId),
      setPresence,
      subscribe: (listener) => {
        listeners.current.add(listener);
        return () => { listeners.current.delete(listener); };
      },
    };
  }, [allPeers, currentUserId, status, setPresence]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
