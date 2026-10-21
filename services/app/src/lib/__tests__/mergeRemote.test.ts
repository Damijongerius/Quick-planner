import { test } from "node:test";
import assert from "node:assert/strict";
import { dirtyKeys, mergeRemote, norm, type Fields } from "../mergeRemote";

const base: Fields = { title: "Render charts", description: "Initial", startDate: "2026-10-01", endDate: "2026-10-10", content: { Priority: "High", Points: 5 } };
const withChange = (over: Partial<Fields>, content?: Record<string, unknown>): Fields => ({ ...base, ...over, content: { ...base.content, ...content } });

test("norm treats empty-ish values and numbers-as-strings as equal", () => {
  assert.equal(norm(undefined), norm(""));
  assert.equal(norm(null), norm(""));
  assert.equal(norm(5), norm("5"));
});

test("dirtyKeys lists exactly the fields that differ", () => {
  assert.deepEqual(dirtyKeys(base, base), []);
  assert.deepEqual(dirtyKeys(base, withChange({ title: "New" })), ["title"]);
  assert.deepEqual(dirtyKeys(base, withChange({}, { Points: "5" })), []); // "5" == 5
  assert.deepEqual(dirtyKeys(base, withChange({}, { Points: "8", Owner: "Sam" })).sort(), ["content:Owner", "content:Points"]);
});

test("a remote change to a field you didn't touch is applied silently", () => {
  const r = mergeRemote(base, base, withChange({ title: "Render charts v2" }));
  assert.equal(r.local.title, "Render charts v2");
  assert.equal(r.baseline.title, "Render charts v2");
  assert.deepEqual(r.conflicts, []);
});

test("your own edit to a field they didn't change is left alone", () => {
  const mine = withChange({ description: "My notes" });
  const r = mergeRemote(base, mine, base);
  assert.equal(r.local.description, "My notes");
  assert.deepEqual(r.conflicts, []);
});

test("editing different fields at the same time merges both without conflict", () => {
  const mine = withChange({ title: "My title" });
  const theirs = withChange({ description: "Their description" });
  const r = mergeRemote(base, mine, theirs);
  assert.equal(r.local.title, "My title");
  assert.equal(r.local.description, "Their description");
  assert.deepEqual(r.conflicts, []);
  // my title is still unsaved, so it stays "dirty" against the new baseline
  assert.deepEqual(dirtyKeys(r.baseline, r.local), ["title"]);
});

test("editing the SAME field differently is a conflict and your text is kept", () => {
  const mine = withChange({ description: "Mine" });
  const theirs = withChange({ description: "Theirs" });
  const r = mergeRemote(base, mine, theirs);
  assert.equal(r.local.description, "Mine");
  assert.equal(r.baseline.description, "Theirs");
  assert.deepEqual(r.conflicts, [{ key: "description", label: "Description", mine: "Mine", theirs: "Theirs" }]);
});

test("both people arriving at the same value is not a conflict", () => {
  const r = mergeRemote(base, withChange({ title: "Same" }), withChange({ title: "Same" }));
  assert.deepEqual(r.conflicts, []);
  assert.deepEqual(dirtyKeys(r.baseline, r.local), []);
});

test("custom fields merge per field, including newly added values", () => {
  const mine = withChange({}, { Points: "13" });
  const theirs = withChange({}, { Priority: "Low", Owner: "Sam" });
  const r = mergeRemote(base, mine, theirs);
  assert.equal(r.local.content.Points, "13");
  assert.equal(r.local.content.Priority, "Low");
  assert.equal(r.local.content.Owner, "Sam");
  assert.deepEqual(r.conflicts, []);
  const clash = mergeRemote(base, withChange({}, { Priority: "Medium" }), withChange({}, { Priority: "Low" }));
  assert.deepEqual(clash.conflicts.map((c) => c.key), ["content:Priority"]);
});

test("merging an unchanged remote is a no-op", () => {
  const mine = withChange({ title: "Draft" });
  const r = mergeRemote(base, mine, base);
  assert.deepEqual(r.local, mine);
  assert.deepEqual(r.baseline, base);
  assert.deepEqual(r.conflicts, []);
});
