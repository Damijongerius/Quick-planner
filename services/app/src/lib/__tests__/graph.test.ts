import { test } from "node:test";
import assert from "node:assert/strict";
import { isReachable, collectDescendants } from "../graph";

// Build an async "next" lookup from an adjacency list: node id -> neighbours.
const adjacency = (edges: Record<string, string[]>) => async (ids: string[]) =>
  ids.flatMap((id) => edges[id] ?? []);

test("isReachable: direct and transitive paths", async () => {
  const next = adjacency({ a: ["b"], b: ["c"], c: [] });
  assert.equal(await isReachable("a", "b", next), true);
  assert.equal(await isReachable("a", "c", next), true);
  assert.equal(await isReachable("c", "a", next), false);
});

test("isReachable: a node reaches itself", async () => {
  assert.equal(await isReachable("a", "a", adjacency({})), true);
});

test("isReachable: terminates on cyclic data", async () => {
  const next = adjacency({ a: ["b"], b: ["c"], c: ["a"] });
  assert.equal(await isReachable("a", "zzz", next), false);
});

test("isReachable: one lookup per level, not per node", async () => {
  let calls = 0;
  const edges: Record<string, string[]> = { root: ["a", "b", "c"], a: ["d"], b: ["e"], c: ["f"] };
  const next = async (ids: string[]) => {
    calls++;
    return ids.flatMap((id) => edges[id] ?? []);
  };
  assert.equal(await isReachable("root", "missing", next), false);
  assert.equal(calls, 3); // root, [a b c], [d e f]
});

test("collectDescendants: gathers the whole subtree without the root", async () => {
  const kids: Record<string, string[]> = { root: ["a", "b"], a: ["c"], b: [], c: [] };
  const getChildren = async (ids: string[]) => ids.flatMap((id) => (kids[id] ?? []).map((child) => ({ id: child })));
  assert.deepEqual((await collectDescendants("root", getChildren)).sort(), ["a", "b", "c"]);
});

test("collectDescendants: a filtered-out child also hides its subtree", async () => {
  const kids: Record<string, string[]> = { root: ["done", "open"], done: ["hidden"], open: ["visible"] };
  const getChildren = async (ids: string[]) =>
    ids.flatMap((id) => (kids[id] ?? []).map((child) => ({ id: child, status: child === "done" ? "DONE" : "TODO" })));
  const result = await collectDescendants("root", getChildren, (c) => c.status !== "DONE");
  assert.deepEqual(result.sort(), ["open", "visible"]);
});

test("collectDescendants: terminates on cyclic data and never returns the root", async () => {
  const kids: Record<string, string[]> = { a: ["b"], b: ["c"], c: ["a"] };
  const getChildren = async (ids: string[]) => ids.flatMap((id) => (kids[id] ?? []).map((child) => ({ id: child })));
  assert.deepEqual((await collectDescendants("a", getChildren)).sort(), ["b", "c"]);
});
