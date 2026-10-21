import { test } from "node:test";
import assert from "node:assert/strict";
import { isPrivateAddress, normalizeEvents, signPayload, subscribesTo, verifySignature, webhookUrlProblem, generateSecret } from "../webhooks/security";

test("signatures bind the body and the timestamp", () => {
  const secret = generateSecret();
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = signPayload(secret, ts, '{"a":1}');
  assert.match(sig, /^sha256=[0-9a-f]{64}$/);
  assert.equal(verifySignature(secret, ts, '{"a":1}', sig), true);
  assert.equal(verifySignature(secret, ts, '{"a":2}', sig), false);
  assert.equal(verifySignature(secret, String(Number(ts) + 1), '{"a":1}', sig), false);
  assert.equal(verifySignature("whsec_other", ts, '{"a":1}', sig), false);
});

test("old timestamps are rejected (replay protection)", () => {
  const secret = "whsec_x";
  const old = String(Math.floor(Date.now() / 1000) - 3600);
  assert.equal(verifySignature(secret, old, "{}", signPayload(secret, old, "{}")), false);
});

test("event subscriptions", () => {
  assert.equal(normalizeEvents(["item.created", "bogus", "item.created"]), "item.created");
  assert.equal(normalizeEvents(["*", "item.created"]), "*");
  assert.equal(normalizeEvents([]), "*");
  assert.equal(normalizeEvents("item.deleted, comment.created"), "item.deleted,comment.created");
  assert.equal(subscribesTo("*", "item.created"), true);
  assert.equal(subscribesTo("item.deleted", "item.created"), false);
  assert.equal(subscribesTo("item.deleted", "ping"), true);
});

test("private and special addresses are recognised", () => {
  for (const a of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.1.1", "169.254.169.254", "0.0.0.0", "100.64.0.1", "::1", "fd00::1", "fe80::1", "::ffff:10.0.0.1", "224.0.0.1"]) assert.equal(isPrivateAddress(a), true, a);
  for (const a of ["8.8.8.8", "172.32.0.1", "172.15.0.1", "1.1.1.1", "2606:4700:4700::1111", "example.com"]) assert.equal(isPrivateAddress(a), false, a);
});

test("webhook URLs: https only, no credentials, nothing internal", () => {
  assert.equal(webhookUrlProblem("https://hooks.example.com/x"), null);
  assert.match(webhookUrlProblem("http://hooks.example.com/x") ?? "", /https/);
  assert.match(webhookUrlProblem("https://user:pw@hooks.example.com/x") ?? "", /credentials/);
  assert.match(webhookUrlProblem("https://localhost/x") ?? "", /reachable/);
  assert.match(webhookUrlProblem("https://printer.local/x") ?? "", /reachable/);
  assert.match(webhookUrlProblem("https://intranet/x") ?? "", /reachable/);
  assert.match(webhookUrlProblem("https://169.254.169.254/latest/meta-data") ?? "", /private/);
  assert.match(webhookUrlProblem("https://[::1]/x") ?? "", /reachable|private/);
  assert.match(webhookUrlProblem("not a url") ?? "", /full URL/);
  assert.equal(webhookUrlProblem("http://127.0.0.1:9000/x", { allowPrivate: true, allowHttp: true }), null);
});
