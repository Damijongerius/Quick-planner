import { test } from "node:test";
import assert from "node:assert/strict";
import type { Node, Sprint } from "../types";
import { averageVelocity, burndown, chooseUnit, loadOf, plannedItems, pointsOf, velocity } from "../planning";

const taskType = { id: "t", name: "Task", fields: [{ id: "f", nodeTypeId: "t", name: "Story points", type: "NUMBER" }, { id: "g", nodeTypeId: "t", name: "Notes", type: "TEXT" }] };

function node(id: string, extra: Partial<Node> = {}): Node {
  return { id, title: id, status: "TODO", content: {}, nodeTypeId: "t", type: taskType, createdAt: "2026-01-01", updatedAt: "2026-01-01", sprintId: "s1", ...extra } as unknown as Node;
}

test("points come from numeric estimate-like fields only", () => {
  assert.equal(pointsOf(node("a", { content: { "Story points": 5, Notes: "9" } })), 5);
  assert.equal(pointsOf(node("a", { content: { "Story points": "3" } })), 3);
  assert.equal(pointsOf(node("a", { content: { "Story points": -2 } })), 0);
  assert.equal(pointsOf(node("a")), 0);
});

test("unit falls back to item counts when nothing is estimated", () => {
  assert.equal(chooseUnit([node("a"), node("b")]), "items");
  assert.equal(chooseUnit([node("a", { content: { "Story points": 2 } })]), "points");
});

test("planned items skip archived items and parents whose children are also planned", () => {
  const epic = node("epic");
  const task = node("task", { parentLinks: [{ id: "l", parentNode: epic }] });
  const archived = node("old", { isArchived: true });
  const elsewhere = node("elsewhere", { sprintId: "s2" });
  const ids = plannedItems([epic, task, archived, elsewhere], "s1").map((n) => n.id);
  assert.deepEqual(ids, ["task"]);
  assert.deepEqual(plannedItems([elsewhere, node("loose", { sprintId: null })], null).map((n) => n.id), ["loose"]);
});

test("load totals done work and splits it per assignee", () => {
  const items = [
    node("a", { content: { "Story points": 3 }, assigneeId: "u1", assignee: { id: "u1", name: "Sam", email: null, image: null } }),
    node("b", { content: { "Story points": 5 }, assigneeId: "u1", status: "DONE", assignee: { id: "u1", name: "Sam", email: null, image: null } }),
    node("c", { content: { "Story points": 2 } }),
  ];
  const load = loadOf(items, "points");
  assert.equal(load.total, 10);
  assert.equal(load.done, 5);
  assert.deepEqual(load.byAssignee.map((x) => [x.name, x.total]), [["Sam", 8], ["Unassigned", 2]]);
});

test("burndown drops as items finish and stops at today", () => {
  const items = [
    node("a", { status: "DONE", completedAt: "2026-03-02T10:00:00Z" }),
    node("b", { status: "DONE", completedAt: "2026-03-03T10:00:00Z" }),
    node("c"),
    node("d"),
  ];
  const series = burndown(items, "items", new Date("2026-03-01T00:00:00Z"), new Date("2026-03-05T00:00:00Z"), new Date("2026-03-03T12:00:00Z"));
  assert.deepEqual(series.map((p) => p.day), ["2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04", "2026-03-05"]);
  assert.deepEqual(series.map((p) => p.actual), [4, 3, 2, null, null]);
  assert.deepEqual(series.map((p) => p.ideal), [4, 3, 2, 1, 0]);
});

test("burndown without usable dates is empty; items done before the start count at day one", () => {
  assert.deepEqual(burndown([node("a")], "items", null, null), []);
  const early = node("a", { status: "DONE", completedAt: "2026-02-20T00:00:00Z" });
  const series = burndown([early, node("b")], "items", new Date("2026-03-01T00:00:00Z"), new Date("2026-03-02T00:00:00Z"), new Date("2026-03-02T01:00:00Z"));
  assert.equal(series[0].actual, 1);
});

test("a done item without completedAt falls back to its last update", () => {
  const legacy = node("a", { status: "DONE", completedAt: null, updatedAt: "2026-03-02T09:00:00Z" });
  const series = burndown([legacy, node("b")], "items", new Date("2026-03-01T00:00:00Z"), new Date("2026-03-03T00:00:00Z"), new Date("2026-03-03T12:00:00Z"));
  assert.deepEqual(series.map((p) => p.actual), [2, 1, 1]);
});

test("velocity covers started sprints and averages the finished ones", () => {
  const sprints = [
    { id: "s1", name: "S1", status: "COMPLETED" },
    { id: "s2", name: "S2", status: "COMPLETED" },
    { id: "s3", name: "S3", status: "ACTIVE" },
    { id: "s4", name: "S4", status: "PLANNED" },
  ] as unknown as Sprint[];
  const nodes = [
    node("a", { sprintId: "s1", status: "DONE" }), node("b", { sprintId: "s1" }),
    node("c", { sprintId: "s2", status: "DONE" }), node("d", { sprintId: "s2", status: "DONE" }), node("e", { sprintId: "s2", status: "DONE" }),
    node("f", { sprintId: "s3" }),
  ];
  const points = velocity(sprints, nodes, "items");
  assert.deepEqual(points.map((p) => [p.name, p.committed, p.completed]), [["S1", 2, 1], ["S2", 3, 3], ["S3", 1, 0]]);
  assert.equal(averageVelocity(points), 2);
  assert.equal(averageVelocity([]), null);
});
