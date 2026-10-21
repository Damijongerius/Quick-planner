import { test } from "node:test";
import assert from "node:assert/strict";
import { appBaseUrl, enabledProviders, mailConfig } from "../mail/config";
import { escapeHtml, inviteEmail, magicLinkEmail, notificationEmail, oneLine } from "../mail/templates";
import { Throttle } from "../mail/throttle";

test("mail is off until a host and a sender are configured", () => {
  assert.equal(mailConfig({}), null);
  assert.equal(mailConfig({ SMTP_HOST: "smtp.x.io" }), null);
  const c = mailConfig({ SMTP_HOST: "smtp.x.io", EMAIL_FROM: "Planner <no-reply@x.io>", SMTP_PORT: "465", SMTP_USER: "u", SMTP_PASS: "p" });
  assert.deepEqual(c, { host: "smtp.x.io", port: 465, secure: true, user: "u", pass: "p", from: "Planner <no-reply@x.io>" });
  assert.equal(mailConfig({ SMTP_HOST: "h", SMTP_USER: "me@x.io" })?.from, "me@x.io");
  assert.equal(mailConfig({ SMTP_HOST: "h", EMAIL_FROM: "a@b.c" })?.port, 587);
  assert.equal(mailConfig({ SMTP_HOST: "h", EMAIL_FROM: "a@b.c", SMTP_PORT: "465", SMTP_SECURE: "false" })?.secure, false);
});

test("links in emails use APP_URL, then AUTH_URL", () => {
  assert.equal(appBaseUrl({ APP_URL: "https://plan.x.io/", AUTH_URL: "http://localhost:3000" }), "https://plan.x.io");
  assert.equal(appBaseUrl({ AUTH_URL: "http://localhost:3000" }), "http://localhost:3000");
});

test("the sign-in page only offers configured methods", () => {
  assert.deepEqual(enabledProviders({}), { google: false, github: false, email: false, dev: false });
  assert.deepEqual(enabledProviders({ AUTH_GOOGLE_ID: "a", AUTH_GOOGLE_SECRET: "b", AUTH_GITHUB_ID: "c", AUTH_GITHUB_SECRET: "d", SMTP_HOST: "h", EMAIL_FROM: "f@x.io" }, true), { google: true, github: true, email: true, dev: true });
  assert.equal(enabledProviders({ AUTH_GITHUB_ID: "c" }).github, false);
});

test("email content is escaped and subjects are single lines", () => {
  assert.equal(escapeHtml(`<b>"x" & 'y'</b>`), "&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;");
  assert.equal(oneLine("a\r\nBcc: evil@x.io"), "a Bcc: evil@x.io");
  const mail = inviteEmail({ inviterName: "Sam\nBcc: x", projectName: "<script>alert(1)</script>", role: "VIEWER", url: "https://x.io/invite/t?a=1&b=2" });
  assert.ok(!mail.subject.includes("\n"));
  assert.ok(!mail.html.includes("<script>"));
  assert.match(mail.html, /a=1&amp;b=2/);
  assert.match(mail.text, /view and comment on/);
  assert.match(inviteEmail({ inviterName: "S", projectName: "P", role: "EDITOR", url: "u" }).text, /plan and edit/);
});

test("notification and magic-link emails carry the link and the reason", () => {
  const n = notificationEmail({ title: "Alex mentioned you on “Fix login”", projectName: "Apollo", url: "https://x.io/p" });
  assert.match(n.text, /https:\/\/x\.io\/p/);
  assert.match(n.html, /Open in Quick Planner/);
  const m = magicLinkEmail({ url: "https://x.io/cb?token=abc", host: "x.io", minutes: 15 });
  assert.match(m.text, /expires in 15 minutes/);
  assert.match(m.html, /token=abc/);
});

test("throttle allows a few hits per window, per key", () => {
  const t = new Throttle(2, 1000);
  assert.equal(t.take("a", 0), true);
  assert.equal(t.take("a", 10), true);
  assert.equal(t.take("a", 20), false);
  assert.equal(t.take("b", 20), true);
  assert.equal(t.take("a", 1500), true);
});
