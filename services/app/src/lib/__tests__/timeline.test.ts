import { test } from "node:test";
import assert from "node:assert/strict";
import type { Node } from "../types";
import { dependencyEdges, isScheduleConflict } from "../timeline";

const n = (id: string, extra: Partial<Node> = {}) => ({ id, title: id, createdAt: "2026-01-01T00:00:00", ...extra }) as unknown as Node;

test("a dependent item must start the day after its blocker ends", () => {
  assert.equal(isScheduleConflict({ endDate: "2026-03-10T00:00:00" }, { startDate: "2026-03-11T00:00:00", createdAt: "2026-01-01" }), false);
  assert.equal(isScheduleConflict({ endDate: "2026-03-10T00:00:00" }, { startDate: "2026-03-10T09:00:00", createdAt: "2026-01-01" }), true);
  assert.equal(isScheduleConflict({ endDate: "2026-03-10T00:00:00" }, { startDate: "2026-03-05T00:00:00", createdAt: "2026-01-01" }), true);
});

test("without an end date there is nothing to conflict with", () => {
  assert.equal(isScheduleConflict({ endDate: null }, { startDate: "2026-03-05T00:00:00", createdAt: "2026-01-01" }), false);
});

test("edges skip archived items and flag conflicts", () => {
  const a = n("a", { endDate: "2026-03-10T00:00:00" });
  const b = n("b", { startDate: "2026-03-08T00:00:00", blockedBy: [{ id: "l1", blockingNode: a }] });
  const c = n("c", { startDate: "2026-03-20T00:00:00", blockedBy: [{ id: "l2", blockingNode: a }] });
  const old = n("old", { isArchived: true, endDate: "2026-03-01T00:00:00" });
  const d = n("d", { blockedBy: [{ id: "l3", blockingNode: old }] });
  assert.deepEqual(dependencyEdges([a, b, c, d, old]), [
    { from: "a", to: "b", conflict: true },
    { from: "a", to: "c", conflict: false },
  ]);
});
