import { test } from "node:test";
import assert from "node:assert/strict";
import { deriveParentStatus } from "../status";

test("all children done completes the parent", () => {
  assert.equal(deriveParentStatus("IN_PROGRESS", ["DONE", "DONE"]), "DONE");
  assert.equal(deriveParentStatus("TODO", ["DONE"]), "DONE");
});

test("an already-done parent with all children done is left alone", () => {
  assert.equal(deriveParentStatus("DONE", ["DONE", "DONE"]), null);
});

test("a new unfinished child reopens a done parent", () => {
  assert.equal(deriveParentStatus("DONE", ["DONE", "TODO"]), "IN_PROGRESS");
});

test("moving a child back out of done reopens the parent", () => {
  assert.equal(deriveParentStatus("DONE", ["IN_PROGRESS", "DONE"]), "IN_PROGRESS");
});

test("a started child moves a TODO parent to in progress", () => {
  assert.equal(deriveParentStatus("TODO", ["TODO", "IN_PROGRESS"]), "IN_PROGRESS");
  assert.equal(deriveParentStatus("TODO", ["REVIEW", "TODO"]), "IN_PROGRESS");
});

test("a TODO parent with only TODO children stays TODO", () => {
  assert.equal(deriveParentStatus("TODO", ["TODO", "TODO"]), null);
});

test("an in-progress or review parent is not forced backwards", () => {
  assert.equal(deriveParentStatus("IN_PROGRESS", ["TODO", "TODO"]), null);
  assert.equal(deriveParentStatus("REVIEW", ["TODO", "IN_PROGRESS"]), null);
});

test("no children means no change", () => {
  assert.equal(deriveParentStatus("TODO", []), null);
  assert.equal(deriveParentStatus("DONE", []), null);
});

import { completedAtFor } from "../status";

test("completedAt is set when an item becomes DONE and cleared when it is reopened", () => {
  const now = new Date("2026-10-01T10:00:00Z");
  assert.equal(completedAtFor("IN_PROGRESS", "DONE", now), now);
  assert.equal(completedAtFor("TODO", "DONE", now), now);
  assert.equal(completedAtFor("DONE", "IN_PROGRESS", now), null);
  assert.equal(completedAtFor("DONE", "TODO", now), null);
});

test("completedAt is left alone when the status doesn't cross the DONE line", () => {
  assert.equal(completedAtFor("TODO", "IN_PROGRESS"), undefined);
  assert.equal(completedAtFor("IN_PROGRESS", "REVIEW"), undefined);
  assert.equal(completedAtFor("DONE", "DONE"), undefined);
  assert.equal(completedAtFor(null, "TODO"), undefined);
});
