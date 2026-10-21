import { test } from "node:test";
import assert from "node:assert/strict";
import { SHORTCUT_HELP, goPathFor, isTypingElement } from "../shortcuts";

test("g + key resolves to a page, case-insensitively, and unknown keys resolve to nothing", () => {
  assert.equal(goPathFor("b"), "board");
  assert.equal(goPathFor("T"), "timeline");
  assert.equal(goPathFor("m"), "settings/members");
  assert.equal(goPathFor("z"), null);
});

test("typing in fields never counts as a shortcut", () => {
  assert.equal(isTypingElement({ tagName: "INPUT" }), true);
  assert.equal(isTypingElement({ tagName: "textarea" }), true);
  assert.equal(isTypingElement({ tagName: "SELECT" }), true);
  assert.equal(isTypingElement({ tagName: "DIV", isContentEditable: true }), true);
  assert.equal(isTypingElement({ tagName: "DIV", getAttribute: () => "textbox" }), true);
  assert.equal(isTypingElement({ tagName: "BUTTON" }), false);
  assert.equal(isTypingElement(null), false);
});

test("every navigation shortcut appears in the help list exactly once", () => {
  const goKeys = SHORTCUT_HELP.filter((h) => h.keys[0] === "g").map((h) => h.keys[1]);
  assert.equal(new Set(goKeys).size, goKeys.length);
  assert.ok(goKeys.includes("b") && goKeys.includes("l") && goKeys.includes("t"));
});
