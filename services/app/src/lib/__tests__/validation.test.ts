import { test } from "node:test";
import assert from "node:assert/strict";
import { cleanTitle, cleanName, assertNodeStatus, parseDate, sanitizeContent, type FieldRow } from "../validation";

const fields: FieldRow[] = [
  { name: "Notes", type: "TEXT", required: false, options: null },
  { name: "Points", type: "NUMBER", required: false, options: null },
  { name: "Due", type: "DATE", required: false, options: null },
  { name: "Blocked", type: "CHECKBOX", required: false, options: null },
  { name: "Priority", type: "SELECT", required: false, options: [{ value: "High", color: "#f00" }, "Low"] },
];

test("cleanTitle trims and rejects empty / oversized input", () => {
  assert.equal(cleanTitle("  hello  "), "hello");
  assert.throws(() => cleanTitle("   "), /required/);
  assert.throws(() => cleanTitle(undefined), /required/);
  assert.throws(() => cleanTitle(42), /required/);
  assert.throws(() => cleanTitle("x".repeat(201)), /at most 200/);
  assert.throws(() => cleanName("x".repeat(121)), /at most 120/);
});

test("assertNodeStatus accepts the board statuses only", () => {
  for (const s of ["TODO", "IN_PROGRESS", "REVIEW", "DONE"]) assert.doesNotThrow(() => assertNodeStatus(s));
  assert.throws(() => assertNodeStatus("BLOCKED"), /Invalid status/);
  assert.throws(() => assertNodeStatus(undefined), /Invalid status/);
});

test("parseDate distinguishes 'not provided', 'clear' and invalid", () => {
  assert.equal(parseDate(undefined, "date"), undefined);
  assert.equal(parseDate(null, "date"), null);
  assert.equal(parseDate("", "date"), null);
  assert.equal(parseDate("2026-03-01", "date")?.toISOString().slice(0, 10), "2026-03-01");
  assert.throws(() => parseDate("not-a-date", "start date"), /Invalid start date/);
});

test("sanitizeContent coerces numeric strings and keeps valid values", () => {
  const out = sanitizeContent(fields, { Notes: "hi", Points: "5", Due: "2026-01-02", Blocked: true, Priority: "High" });
  assert.deepEqual(out, { Notes: "hi", Points: 5, Due: "2026-01-02", Blocked: true, Priority: "High" });
});

test("sanitizeContent drops values for fields that no longer exist", () => {
  assert.deepEqual(sanitizeContent(fields, { Notes: "x", Removed: "y" }), { Notes: "x" });
});

test("sanitizeContent keeps empty values so a field can be cleared", () => {
  assert.deepEqual(sanitizeContent(fields, { Notes: "", Points: null }), { Notes: "", Points: null });
});

test("sanitizeContent rejects values of the wrong type", () => {
  assert.throws(() => sanitizeContent(fields, { Points: "abc" }), /must be a number/);
  assert.throws(() => sanitizeContent(fields, { Blocked: "yes" }), /true or false/);
  assert.throws(() => sanitizeContent(fields, { Due: "tomorrow-ish" }), /valid date/);
  assert.throws(() => sanitizeContent(fields, { Notes: 7 }), /must be text/);
  assert.throws(() => sanitizeContent(fields, { Priority: "Urgent" }), /invalid option/);
});

test("sanitizeContent accepts plain-string and object select options", () => {
  assert.doesNotThrow(() => sanitizeContent(fields, { Priority: "Low" }));
  assert.doesNotThrow(() => sanitizeContent(fields, { Priority: "High" }));
});

test("required fields are enforced on create but not on partial updates", () => {
  const required: FieldRow[] = [{ name: "Owner", type: "TEXT", required: true, options: null }];
  assert.throws(() => sanitizeContent(required, {}), /"Owner" is required/);
  assert.throws(() => sanitizeContent(required, { Owner: "" }), /"Owner" is required/);
  assert.doesNotThrow(() => sanitizeContent(required, {}, { partial: true }));
  assert.deepEqual(sanitizeContent(required, { Owner: "Sam" }), { Owner: "Sam" });
});
