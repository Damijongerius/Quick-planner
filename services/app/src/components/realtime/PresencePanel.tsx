"use client";

import { Avatar } from "../ui/Avatar";
import { useRealtime } from "./RealtimeProvider";

const PAGE_LABEL: Record<string, string> = { board: "Board", backlog: "Backlog", timeline: "Timeline", sprints: "Sprints", members: "Members", nodes: "Item types", history: "History" };

/** Sidebar section: who else is in the project right now and where they are. */
export function PresencePanel() {
  const { peers, status } = useRealtime();

  return (
    <div className="px-3 pb-2" aria-label="People online">
      <p className="mb-1.5 flex items-center gap-1.5 px-2.5 text-xs font-medium text-faint">
        <span
          className={`h-1.5 w-1.5 rounded-full ${status === "live" ? "bg-success" : status === "connecting" ? "bg-warning" : "bg-danger"}`}
          title={status === "live" ? "Live: changes appear instantly" : status === "connecting" ? "Connecting…" : "Offline: refreshing periodically"}
        />
        {status === "offline" ? "Offline" : peers.length > 0 ? `Online now · ${peers.length}` : "Just you"}
      </p>
      {peers.length > 0 && (
        <ul className="flex flex-col gap-0.5">
          {peers.slice(0, 6).map((p) => (
            <li key={p.userId} className="flex items-center gap-2 rounded-md px-2.5 py-1 text-sm">
              <span className={`rounded-full ${p.editing ? "peer-editing" : ""}`}><Avatar src={p.image} name={p.name} size="xs" /></span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-fg">{p.name ?? "Someone"}</span>
                <span className="block truncate text-xs text-faint">
                  {p.editing ? "Editing an item" : p.viewing ? "Viewing an item" : p.page ? PAGE_LABEL[p.page] ?? "" : ""}
                </span>
              </span>
            </li>
          ))}
          {peers.length > 6 && <li className="px-2.5 text-xs text-faint">+{peers.length - 6} more</li>}
        </ul>
      )}
    </div>
  );
}
