"use client";

import { Avatar } from "../ui/Avatar";
import { useRealtime } from "./RealtimeProvider";

/** Small avatars of teammates who have this item open. A pulsing ring means they're typing in it. */
export function PeerBadges({ nodeId, max = 2 }: Readonly<{ nodeId: string; max?: number }>) {
  const { peersFor } = useRealtime();
  const peers = peersFor(nodeId);
  if (peers.length === 0) return null;
  const shown = peers.slice(0, max);

  return (
    <span className="inline-flex items-center -space-x-1.5" aria-label={peers.map((p) => `${p.name ?? "Someone"} is ${p.editing === nodeId ? "editing" : "viewing"}`).join(", ")}>
      {shown.map((p) => (
        <span
          key={p.userId}
          title={`${p.name ?? "Someone"} is ${p.editing === nodeId ? "editing this" : "viewing this"}`}
          className={`rounded-full ring-2 ring-panel ${p.editing === nodeId ? "peer-editing" : ""}`}
        >
          <Avatar src={p.image} name={p.name} size="xs" />
        </span>
      ))}
      {peers.length > max && <span className="ml-2 text-xs text-faint">+{peers.length - max}</span>}
    </span>
  );
}
