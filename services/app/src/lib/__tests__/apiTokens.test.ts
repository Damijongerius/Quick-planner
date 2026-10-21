import { test } from "node:test";
import assert from "node:assert/strict";
import { generateToken, hashToken, parseBearer, safeEqual } from "../api/tokens";

test("tokens are random, prefixed, and only their hash is derivable", () => {
  const a = generateToken(), b = generateToken();
  assert.notEqual(a.token, b.token);
  assert.match(a.token, /^qp_[A-Za-z0-9_-]{43}$/);
  assert.equal(a.prefix, a.token.slice(0, 11));
  assert.equal(a.hash, hashToken(a.token));
  assert.equal(a.hash.length, 64);
  assert.ok(!a.hash.includes(a.token.slice(3, 10)));
});

test("bearer parsing is strict", () => {
  const { token } = generateToken();
  assert.equal(parseBearer(`Bearer ${token}`), token);
  assert.equal(parseBearer(`bearer ${token}`), null);
  assert.equal(parseBearer(`Bearer ${token}x y`), null);
  assert.equal(parseBearer("Bearer other_prefix_123456789012345678901234"), null);
  assert.equal(parseBearer(""), null);
  assert.equal(parseBearer(undefined), null);
});

test("safeEqual compares without caring about length leaks", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
});
