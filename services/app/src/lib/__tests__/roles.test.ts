import { test } from "node:test";
import assert from "node:assert/strict";
import { canEdit, canManage, isInvitableRole, isProjectRole, normalizeEmail } from "../roles";

test("owner and editor can edit, viewer cannot", () => {
  assert.equal(canEdit("OWNER"), true);
  assert.equal(canEdit("EDITOR"), true);
  assert.equal(canEdit("VIEWER"), false);
});

test("only the owner can manage the project", () => {
  assert.equal(canManage("OWNER"), true);
  assert.equal(canManage("EDITOR"), false);
  assert.equal(canManage("VIEWER"), false);
});

test("the owner role can never be handed out by invite", () => {
  assert.equal(isInvitableRole("EDITOR"), true);
  assert.equal(isInvitableRole("VIEWER"), true);
  assert.equal(isInvitableRole("OWNER"), false);
  assert.equal(isInvitableRole("admin"), false);
  assert.equal(isInvitableRole(undefined), false);
});

test("isProjectRole accepts exactly the three roles", () => {
  for (const r of ["OWNER", "EDITOR", "VIEWER"]) assert.equal(isProjectRole(r), true);
  for (const r of ["owner", "", null, 3]) assert.equal(isProjectRole(r), false);
});

test("normalizeEmail trims, lower-cases and rejects junk", () => {
  assert.equal(normalizeEmail("  Alex@Example.COM "), "alex@example.com");
  for (const bad of ["", "alex", "alex@", "@example.com", "a b@example.com", "a@b", null, undefined, 42]) {
    assert.equal(normalizeEmail(bad), null, String(bad));
  }
  assert.equal(normalizeEmail("a@b.co".padEnd(300, "x") + ".com"), null);
});
