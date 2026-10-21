import { test } from "node:test";
import assert from "node:assert/strict";
import { describeEvent, mergeActivity } from "../activity";

test("history events read as sentences", () => {
  assert.equal(describeEvent({ action: "STATUS_CHANGE", entityType: "NODE", oldValue: "TODO", newValue: "IN_PROGRESS" }), "changed the status from To do to In progress");
  assert.equal(describeEvent({ action: "STATUS_CHANGE", entityType: "NODE", oldValue: "IN_PROGRESS", newValue: "DONE (Auto)" }), "changed the status from In progress to Done (auto)");
  assert.equal(describeEvent({ action: "ASSIGN", entityType: "NODE", oldValue: "Unassigned", newValue: "Sam" }), "assigned this to Sam");
  assert.equal(describeEvent({ action: "ASSIGN", entityType: "NODE", oldValue: "Sam", newValue: "Unassigned" }), "unassigned this item");
  assert.equal(describeEvent({ action: "MOVE", entityType: "NODE", newValue: "Sprint 2" }), "moved this to Sprint 2");
  assert.equal(describeEvent({ action: "UPDATE", entityType: "NODE", oldValue: "Old", newValue: "New" }), "changed “Old” to “New”");
  assert.equal(describeEvent({ action: "UPDATE", entityType: "NODE" }), "updated this item");
  assert.equal(describeEvent({ action: "CREATE", entityType: "NODE" }), "created this item");
});

test("comments and events merge into one oldest-first timeline", () => {
  const merged = mergeActivity(
    [{ id: "c1", body: "hi", createdAt: "2026-01-02T10:00:00Z", user: { name: "Alex", image: null }, canDelete: true }],
    [
      { id: "h1", action: "CREATE", entityType: "NODE", createdAt: "2026-01-01T09:00:00Z", user: { name: "Sam", image: null } },
      { id: "h2", action: "STATUS_CHANGE", entityType: "NODE", oldValue: "TODO", newValue: "DONE", createdAt: new Date("2026-01-03T09:00:00Z"), user: null },
    ]
  );
  assert.deepEqual(merged.map((m) => m.id), ["h-h1", "c-c1", "h-h2"]);
  assert.equal(merged[0].kind, "event");
  assert.equal(merged[1].kind, "comment");
});
