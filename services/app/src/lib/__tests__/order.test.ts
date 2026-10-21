import { test } from "node:test";
import assert from "node:assert/strict";
import { POSITION_STEP, assignPositions, byRank, moveInList } from "../order";

test("byRank sorts by position, then by creation time", () => {
  const items = [
    { id: "c", position: 2048, createdAt: "2026-01-01" },
    { id: "a", position: 0, createdAt: "2026-01-03" },
    { id: "b", position: 0, createdAt: "2026-01-02" },
    { id: "d", createdAt: "2026-01-01" }, // legacy item without a position behaves like 0
  ];
  assert.deepEqual([...items].sort(byRank).map((i) => i.id), ["d", "b", "a", "c"]);
});

test("moveInList moves one item without touching the others' order", () => {
  assert.deepEqual(moveInList(["a", "b", "c", "d"], 0, 2), ["b", "c", "a", "d"]);
  assert.deepEqual(moveInList(["a", "b", "c", "d"], 3, 0), ["d", "a", "b", "c"]);
});

test("moveInList ignores no-ops and out-of-range moves and never mutates its input", () => {
  const list = ["a", "b", "c"];
  assert.deepEqual(moveInList(list, 1, 1), list);
  assert.deepEqual(moveInList(list, -1, 1), list);
  assert.deepEqual(moveInList(list, 0, 9), list);
  assert.deepEqual(list, ["a", "b", "c"]);
});

test("assignPositions produces strictly increasing positions in the given order", () => {
  const map = assignPositions(["x", "y", "z"], 5);
  assert.deepEqual([...map.entries()], [["x", 5], ["y", 5 + POSITION_STEP], ["z", 5 + 2 * POSITION_STEP]]);
});

import { placeInList } from "../order";

test("placeInList inserts into another column at the dropped index", () => {
  assert.deepEqual(placeInList(["a", "b", "c"], "x", 0), ["x", "a", "b", "c"]);
  assert.deepEqual(placeInList(["a", "b", "c"], "x", 2), ["a", "b", "x", "c"]);
  assert.deepEqual(placeInList(["a", "b", "c"], "x", 3), ["a", "b", "c", "x"]);
});

test("placeInList reorders within the same column", () => {
  assert.deepEqual(placeInList(["a", "b", "c", "d"], "a", 2), ["b", "c", "a", "d"]);
  assert.deepEqual(placeInList(["a", "b", "c", "d"], "d", 0), ["d", "a", "b", "c"]);
});

test("placeInList clamps out-of-range indexes and handles an empty column", () => {
  assert.deepEqual(placeInList([], "x", 5), ["x"]);
  assert.deepEqual(placeInList(["a"], "x", -3), ["x", "a"]);
});
