import { test } from "node:test";
import assert from "node:assert/strict";
import { matchesAssignee } from "../assignee";

test("'all' matches everything", () => {
  assert.equal(matchesAssignee(null, "all", "me"), true);
  assert.equal(matchesAssignee("x", "all", "me"), true);
});

test("'me' matches only my own items", () => {
  assert.equal(matchesAssignee("me", "me", "me"), true);
  assert.equal(matchesAssignee("other", "me", "me"), false);
  assert.equal(matchesAssignee(null, "me", "me"), false);
});

test("'none' matches only unassigned items", () => {
  assert.equal(matchesAssignee(null, "none", "me"), true);
  assert.equal(matchesAssignee(undefined, "none", "me"), true);
  assert.equal(matchesAssignee("x", "none", "me"), false);
});

test("a person id matches only that person", () => {
  assert.equal(matchesAssignee("alex", "alex", "me"), true);
  assert.equal(matchesAssignee("sam", "alex", "me"), false);
  assert.equal(matchesAssignee(null, "alex", "me"), false);
});
