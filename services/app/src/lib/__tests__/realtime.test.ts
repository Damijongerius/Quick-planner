import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_CONNECTIONS_PER_USER, RealtimeHub, type RealtimeEvent } from "../realtime/hub";

const alex = { id: "alex", name: "Alex", image: null };
const sam = { id: "sam", name: "Sam", image: null };

function connect(hub: RealtimeHub, project: string, user: typeof alex) {
  const events: RealtimeEvent[] = [];
  let closed = false;
  const conn = hub.connect(project, user, (e) => events.push(e), () => { closed = true; });
  assert.ok(conn);
  return { ...conn!, events, isClosed: () => closed };
}
const last = (events: RealtimeEvent[], type: string) => [...events].reverse().find((e) => e.type === type);

test("connecting broadcasts who is online to everyone in that project only", () => {
  const hub = new RealtimeHub();
  const a = connect(hub, "p1", alex);
  const other = connect(hub, "p2", sam);
  const s = connect(hub, "p1", sam);
  const presence = last(a.events, "presence") as Extract<RealtimeEvent, { type: "presence" }>;
  assert.deepEqual(presence.peers.map((p) => p.userId), ["alex", "sam"]);
  assert.equal((last(other.events, "presence") as Extract<RealtimeEvent, { type: "presence" }>).peers.length, 1);
  assert.ok(last(s.events, "presence"));
});

test("disconnecting removes the person and tells the others", () => {
  const hub = new RealtimeHub();
  const a = connect(hub, "p1", alex);
  const s = connect(hub, "p1", sam);
  s.disconnect();
  const presence = last(a.events, "presence") as Extract<RealtimeEvent, { type: "presence" }>;
  assert.deepEqual(presence.peers.map((p) => p.userId), ["alex"]);
  assert.equal(hub.connectionCount("p1"), 1);
});

test("presence updates are visible to others and require owning the connection", () => {
  const hub = new RealtimeHub();
  const a = connect(hub, "p1", alex);
  const s = connect(hub, "p1", sam);
  assert.equal(hub.updatePresence(a.clientId, "alex", { page: "board", viewing: "n1" }), true);
  const peers = (last(s.events, "presence") as Extract<RealtimeEvent, { type: "presence" }>).peers;
  assert.deepEqual(peers.find((p) => p.userId === "alex"), { userId: "alex", name: "Alex", image: null, page: "board", viewing: "n1", editing: null });
  // Sam may not move Alex's cursor
  assert.equal(hub.updatePresence(a.clientId, "sam", { viewing: "n2" }), false);
  assert.equal(hub.updatePresence("nope", "alex", { viewing: "n2" }), false);
});

test("you can only be editing the item you have open", () => {
  const hub = new RealtimeHub();
  const a = connect(hub, "p1", alex);
  hub.updatePresence(a.clientId, "alex", { viewing: "n1", editing: "n1" });
  assert.equal(hub.peers("p1")[0].editing, "n1");
  hub.updatePresence(a.clientId, "alex", { viewing: "n2" });
  assert.equal(hub.peers("p1")[0].editing, null);
  hub.updatePresence(a.clientId, "alex", { editing: "n9" });
  assert.equal(hub.peers("p1")[0].editing, null);
});

test("several tabs of one person show up once, using the most recent tab", async () => {
  const hub = new RealtimeHub();
  const t1 = connect(hub, "p1", alex);
  const t2 = connect(hub, "p1", alex);
  hub.updatePresence(t1.clientId, "alex", { viewing: "old" });
  await new Promise((r) => setTimeout(r, 3));
  hub.updatePresence(t2.clientId, "alex", { viewing: "new" });
  const peers = hub.peers("p1");
  assert.equal(peers.length, 1);
  assert.equal(peers[0].viewing, "new");
  t2.disconnect();
  assert.equal(hub.peers("p1")[0].viewing, "old");
});

test("changes are delivered to everyone connected to that project", () => {
  const hub = new RealtimeHub();
  const a = connect(hub, "p1", alex);
  const s = connect(hub, "p1", sam);
  const other = connect(hub, "p2", sam);
  hub.publish("p1", { type: "changed", scope: "nodes", by: "alex", nodeId: "n1" });
  assert.deepEqual(last(s.events, "changed"), { type: "changed", scope: "nodes", by: "alex", nodeId: "n1" });
  assert.ok(last(a.events, "changed"));
  assert.equal(last(other.events, "changed"), undefined);
});

test("kicking a user closes all their streams and notifies them, but not others", () => {
  const hub = new RealtimeHub();
  const a1 = connect(hub, "p1", alex);
  const a2 = connect(hub, "p1", alex);
  const s = connect(hub, "p1", sam);
  hub.kickUser("p1", "alex");
  assert.ok(a1.isClosed() && a2.isClosed());
  assert.ok(last(a1.events, "kicked"));
  assert.equal(s.isClosed(), false);
  assert.deepEqual(hub.peers("p1").map((p) => p.userId), ["sam"]);
});

test("a user cannot open unlimited streams", () => {
  const hub = new RealtimeHub();
  for (let i = 0; i < MAX_CONNECTIONS_PER_USER; i++) connect(hub, "p1", alex);
  assert.equal(hub.connect("p1", alex, () => {}, () => {}), null);
  assert.ok(hub.connect("p1", sam, () => {}, () => {}));
});

test("a dead stream is dropped instead of breaking the publisher", () => {
  const hub = new RealtimeHub();
  hub.connect("p1", alex, () => { throw new Error("socket closed"); }, () => {});
  const s = connect(hub, "p1", sam);
  assert.doesNotThrow(() => hub.publish("p1", { type: "changed", scope: "nodes", by: "sam" }));
  assert.ok(last(s.events, "changed"));
  assert.equal(hub.connectionCount("p1"), 1);
});

test("a personal notification reaches every connection of that person, across projects, and nobody else", () => {
  const hub = new RealtimeHub();
  const a1 = connect(hub, "p1", alex);
  const a2 = connect(hub, "p2", alex);
  const s = connect(hub, "p1", sam);
  hub.publishToUser("alex", { type: "notification" });
  assert.ok(last(a1.events, "notification"));
  assert.ok(last(a2.events, "notification"));
  assert.equal(last(s.events, "notification"), undefined);
});
