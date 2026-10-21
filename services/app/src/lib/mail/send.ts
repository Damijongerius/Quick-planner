// Server-only. Sending never throws: callers decide what a failure means for them.

import nodemailer, { type Transporter } from "nodemailer";
import { mailConfig } from "./config";
import type { Email } from "./templates";

let cached: { key: string; transport: Transporter } | null = null;

function transportFor(config: NonNullable<ReturnType<typeof mailConfig>>): Transporter {
  const key = JSON.stringify(config);
  if (cached?.key === key) return cached.transport;
  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 15_000,
    // A local test inbox rarely has a valid certificate; real servers always do.
    tls: { rejectUnauthorized: process.env.SMTP_ALLOW_SELF_SIGNED !== "true" },
  });
  cached = { key, transport };
  return transport;
}

export type SendResult = { sent: true } | { sent: false; reason: "not-configured" | "failed"; error?: string };

export async function sendMail(to: string, email: Email): Promise<SendResult> {
  const config = mailConfig();
  if (!config) return { sent: false, reason: "not-configured" };
  try {
    await transportFor(config).sendMail({ from: config.from, to, subject: email.subject, text: email.text, html: email.html });
    return { sent: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[mail] could not send:", message);
    return { sent: false, reason: "failed", error: message };
  }
}
