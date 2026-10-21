import { test } from "node:test";
import assert from "node:assert/strict";
import { compact, niceScale } from "../chartScale";

test("nice scales round up to clean ticks", () => {
  assert.deepEqual(niceScale(8), { max: 8, ticks: [0, 2, 4, 6, 8] });
  assert.deepEqual(niceScale(23).ticks, [0, 10, 20, 30]);
  assert.ok(niceScale(0).max >= 1);
  assert.deepEqual(niceScale(1234).ticks, [0, 500, 1000, 1500]);
});

test("compact formats thousands", () => {
  assert.equal(compact(1200), "1.2K");
  assert.equal(compact(7), "7");
  assert.equal(compact(2.5), "2.5");
});
