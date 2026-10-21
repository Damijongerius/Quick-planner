import { test } from "node:test";
import assert from "node:assert/strict";
import { isDevLoginEnabled } from "../devLogin";

test("off unless explicitly enabled", () => {
  assert.equal(isDevLoginEnabled({ AUTH_URL: "http://localhost:3000" }), false);
  assert.equal(isDevLoginEnabled({ AUTH_DEV_LOGIN: "false", AUTH_URL: "http://localhost:3000" }), false);
  assert.equal(isDevLoginEnabled({ AUTH_DEV_LOGIN: "1", AUTH_URL: "http://localhost:3000" }), false);
});

test("on only for localhost URLs", () => {
  for (const url of ["http://localhost:3000", "http://127.0.0.1:3000", "http://[::1]:3000"]) {
    assert.equal(isDevLoginEnabled({ AUTH_DEV_LOGIN: "true", AUTH_URL: url }), true, url);
  }
});

test("never on for real hosts or a missing/invalid AUTH_URL", () => {
  for (const url of ["https://planner.example.com", "http://localhost.evil.com", "http://10.0.0.5:3000", "", "not a url", undefined]) {
    assert.equal(isDevLoginEnabled({ AUTH_DEV_LOGIN: "true", AUTH_URL: url }), false, String(url));
  }
});
