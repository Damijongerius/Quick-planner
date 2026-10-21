import { test } from "node:test";
import assert from "node:assert/strict";
import { flagCodec, isViewPage, listCodec, pickViewQuery, sameQuery, stringCodec, stringWithDefault } from "../urlState";

test("string codec omits empty values", () => {
  assert.equal(stringCodec.serialize(""), null);
  assert.equal(stringCodec.serialize("bug"), "bug");
  assert.equal(stringCodec.parse(null), "");
  assert.equal(stringCodec.parse("bug"), "bug");
});

test("flag codec round-trips and omits false", () => {
  assert.equal(flagCodec.serialize(false), null);
  assert.equal(flagCodec.serialize(true), "1");
  assert.equal(flagCodec.parse("1"), true);
  assert.equal(flagCodec.parse("0"), false);
  assert.equal(flagCodec.parse(null), false);
});

test("list codec round-trips, trims and drops empties", () => {
  assert.deepEqual(listCodec.parse("a, b,,c"), ["a", "b", "c"]);
  assert.equal(listCodec.serialize([]), null);
  assert.equal(listCodec.serialize(["a", "b"]), "a,b");
  assert.deepEqual(listCodec.parse(null), []);
});

test("a default value is kept out of the URL", () => {
  const codec = stringWithDefault("all");
  assert.equal(codec.serialize("all"), null);
  assert.equal(codec.serialize("me"), "me");
  assert.equal(codec.parse(null), "all");
});

test("pickViewQuery keeps only the page's own keys, sorted, and drops everything else", () => {
  assert.equal(pickViewQuery("?q=bug&assignee=me&nodeId=abc&utm=1", "backlog"), "assignee=me&q=bug");
  assert.equal(pickViewQuery("?q=x&done=1", "board"), "q=x");
  assert.equal(pickViewQuery("", "timeline"), "");
});

test("sameQuery ignores order", () => {
  assert.equal(sameQuery("a=1&b=2", "b=2&a=1"), true);
  assert.equal(sameQuery("a=1", "a=2"), false);
});

test("isViewPage only accepts known pages", () => {
  assert.equal(isViewPage("board"), true);
  assert.equal(isViewPage("hasOwnProperty"), false);
  assert.equal(isViewPage("admin"), false);
  assert.equal(isViewPage(undefined), false);
});
