/**
 * In-memory realtime hub: which people are connected to which project, what they're looking at, and fan-out of
 * "something changed" events. It has no framework imports so it can be unit tested; the Next route handlers
 * (app/api/projects/[projectId]/events|presence) and the server actions are thin adapters around it.
 *
 * Scope: a single server process. Running several app instances would need a shared bus (e.g. Redis pub/sub).
 */

export type PresenceState = {
  /** Which part of the app they're on: "board", "backlog", ... */
  page: string | null;
  /** Item id the person has open. */
  viewing: string | null;
  /** Item id the person is currently typing into. */
  editing: string | null;
};

export type Peer = PresenceState & {
  userId: string;
  name: string | null;
  image: string | null;
};

import { isApiContext } from "@/lib/actingStore";

export type ChangeScope = "nodes" | "sprints" | "types" | "comments" | "members" | "project" | "milestones";

export type RealtimeEvent =
  | { type: "presence"; peers: Peer[] }
  | { type: "changed"; scope: ChangeScope; nodeId?: string; by: string }
  | { type: "kicked" }
  | { type: "notification" };

export type Sender = (event: RealtimeEvent) => void;

type Client = {
  id: string;
  projectId: string;
  user: { id: string; name: string | null; image: string | null };
  state: PresenceState;
  updatedAt: number;
  send: Sender;
  close: () => void;
};

const EMPTY: PresenceState = { page: null, viewing: null, editing: null };
export const MAX_CONNECTIONS_PER_USER = 6;

export class RealtimeHub {
  private clients = new Map<string, Client>();
  private byProject = new Map<string, Set<string>>();
  private seq = 0;

  /** Registers a connection. Returns null when the user already has too many open streams. */
  connect(projectId: string, user: Client["user"], send: Sender, close: () => void): { clientId: string; disconnect: () => void } | null {
    const mine = [...this.projectClients(projectId)].filter((c) => c.user.id === user.id);
    if (mine.length >= MAX_CONNECTIONS_PER_USER) return null;

    const id = `c${Date.now().toString(36)}${(this.seq++).toString(36)}${Math.random().toString(36).slice(2, 8)}`;
    const client: Client = { id, projectId, user, state: { ...EMPTY }, updatedAt: Date.now(), send, close };
    this.clients.set(id, client);
    if (!this.byProject.has(projectId)) this.byProject.set(projectId, new Set());
    this.byProject.get(projectId)!.add(id);

    this.broadcastPresence(projectId);
    return { clientId: id, disconnect: () => this.disconnect(id) };
  }

  disconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;
    this.clients.delete(clientId);
    const set = this.byProject.get(client.projectId);
    set?.delete(clientId);
    if (set && set.size === 0) this.byProject.delete(client.projectId);
    this.broadcastPresence(client.projectId);
  }

  /** A client reports what it's looking at. Only the owner of the connection may update it. */
  updatePresence(clientId: string, userId: string, patch: Partial<PresenceState>): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.user.id !== userId) return false;
    const next: PresenceState = {
      page: patch.page !== undefined ? patch.page : client.state.page,
      viewing: patch.viewing !== undefined ? patch.viewing : client.state.viewing,
      // you can't edit something you don't have open
      editing: patch.editing !== undefined ? patch.editing : client.state.editing,
    };
    if (next.editing && next.editing !== next.viewing) next.editing = null;
    if (next.page === client.state.page && next.viewing === client.state.viewing && next.editing === client.state.editing) return true;
    client.state = next;
    client.updatedAt = Date.now();
    this.broadcastPresence(client.projectId);
    return true;
  }

  /** One entry per person (several tabs merge into the most recently active one). */
  peers(projectId: string): Peer[] {
    const latest = new Map<string, Client>();
    for (const client of this.projectClients(projectId)) {
      const current = latest.get(client.user.id);
      if (!current || client.updatedAt >= current.updatedAt) latest.set(client.user.id, client);
    }
    return [...latest.values()]
      .sort((a, b) => (a.user.name ?? "").localeCompare(b.user.name ?? ""))
      .map((c) => ({ userId: c.user.id, name: c.user.name, image: c.user.image, ...c.state }));
  }

  publish(projectId: string, event: Extract<RealtimeEvent, { type: "changed" }>): void {
    for (const client of this.projectClients(projectId)) this.safeSend(client, event);
  }

  /** Tell one person (on every project/tab they have open) that something addressed to them happened. */
  publishToUser(userId: string, event: Extract<RealtimeEvent, { type: "notification" }>): void {
    for (const client of [...this.clients.values()]) if (client.user.id === userId) this.safeSend(client, event);
  }

  /** Cut off every connection a user has to a project (removed from the project, role revoked, ...). */
  kickUser(projectId: string, userId: string): void {
    for (const client of [...this.projectClients(projectId)]) {
      if (client.user.id !== userId) continue;
      this.safeSend(client, { type: "kicked" });
      try { client.close(); } catch { /* already closed */ }
      this.disconnect(client.id);
    }
  }

  /** Whether this person has the project open right now (they'll see the bell, so no email is needed). */
  isUserInProject(projectId: string, userId: string): boolean {
    return this.projectClients(projectId).some((c) => c.user.id === userId);
  }

  connectionCount(projectId?: string): number {
    return projectId ? this.byProject.get(projectId)?.size ?? 0 : this.clients.size;
  }

  private projectClients(projectId: string): Client[] {
    const ids = this.byProject.get(projectId);
    if (!ids) return [];
    return [...ids].map((id) => this.clients.get(id)).filter((c): c is Client => !!c);
  }

  private broadcastPresence(projectId: string): void {
    const event: RealtimeEvent = { type: "presence", peers: this.peers(projectId) };
    for (const client of this.projectClients(projectId)) this.safeSend(client, event);
  }

  private safeSend(client: Client, event: RealtimeEvent): void {
    try {
      client.send(event);
    } catch {
      // The stream is dead; drop the connection instead of throwing into whoever published.
      this.disconnect(client.id);
    }
  }
}

const KEY = "__quickPlannerRealtimeHub";

/** One hub per server process, shared by route handlers and server actions even when they're bundled separately. */
export function getHub(): RealtimeHub {
  const g = globalThis as unknown as Record<string, RealtimeHub | undefined>;
  return (g[KEY] ??= new RealtimeHub());
}

/**
 * Tell everyone in the project something changed. A change made through the API is tagged "api:<user>": that person's
 * own open tabs didn't make it, so they must refresh like anyone else's.
 */
export function publishChange(projectId: string, scope: ChangeScope, by: string, nodeId?: string): void {
  getHub().publish(projectId, { type: "changed", scope, by: isApiContext() ? `api:${by}` : by, ...(nodeId ? { nodeId } : {}) });
}
