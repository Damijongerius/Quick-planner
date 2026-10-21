import { test } from "node:test";
import assert from "node:assert/strict";
import { activeMention, convertMentions, extractMentionIds, plainText, splitBody } from "../mentions";

const people = [
  { id: "user-alex-1", name: "Alex Rivera" },
  { id: "user-alex-2", name: "Alex" },
  { id: "user-sam-01", name: "Sam Okafor" },
];

test("convertMentions turns @Name into tokens and prefers the longest name", () => {
  const out = convertMentions("Thanks @Alex Rivera and @Sam Okafor!", people);
  assert.equal(out, "Thanks [@Alex Rivera](user:user-alex-1) and [@Sam Okafor](user:user-sam-01)!");
  assert.equal(convertMentions("ping @Alex please", people), "ping [@Alex](user:user-alex-2) please");
});

test("convertMentions is case-insensitive, needs a word boundary, and ignores emails", () => {
  assert.equal(convertMentions("hi @sam okafor.", people), "hi [@Sam Okafor](user:user-sam-01).");
  assert.equal(convertMentions("write to team@Alex.com", people), "write to team@Alex.com");
  assert.equal(convertMentions("@Alexander is not Alex", people), "@Alexander is not Alex");
  assert.equal(convertMentions("no mentions here", people), "no mentions here");
});

test("convertMentions does not re-wrap an existing token", () => {
  const once = convertMentions("hey @Alex Rivera", people);
  assert.equal(convertMentions(once, people), once);
});

test("extractMentionIds returns unique ids and ignores malformed tokens", () => {
  const body = "[@Alex Rivera](user:user-alex-1) and [@Alex Rivera](user:user-alex-1) and [@Sam](user:user-sam-01) and [@x](user:)";
  assert.deepEqual(extractMentionIds(body).sort(), ["user-alex-1", "user-sam-01"]);
  assert.deepEqual(extractMentionIds("plain"), []);
});

test("splitBody separates text from mention chips", () => {
  assert.deepEqual(splitBody("Hi [@Sam Okafor](user:user-sam-01), done?"), [
    { type: "text", text: "Hi " },
    { type: "mention", name: "Sam Okafor", userId: "user-sam-01" },
    { type: "text", text: ", done?" },
  ]);
  assert.deepEqual(splitBody("just text"), [{ type: "text", text: "just text" }]);
});

test("plainText shows mentions as @Name", () => {
  assert.equal(plainText("cc [@Sam Okafor](user:user-sam-01)"), "cc @Sam Okafor");
});

test("activeMention finds the @query at the caret", () => {
  assert.deepEqual(activeMention("hello @Al", 9), { start: 6, query: "Al" });
  assert.deepEqual(activeMention("@", 1), { start: 0, query: "" });
  assert.equal(activeMention("mail bob@exa", 12), null);
  assert.equal(activeMention("no at sign", 4), null);
  assert.equal(activeMention("done @Alex\nnext", 15), null);
});
