"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Mail } from "lucide-react";

/** Magic link: type your email, click the link we send. No password to remember or leak. */
export function EmailSignInForm({ callbackUrl }: Readonly<{ callbackUrl: string }>) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const result = await signIn("nodemailer", { email, callbackUrl, redirect: false });
    setState(result?.error ? "error" : "sent");
  };

  if (state === "sent") {
    return (
      <p role="status" className="rounded-lg border border-success/30 bg-success-soft px-3 py-2.5 text-left text-sm text-success">
        Check your inbox: we sent a sign-in link to <strong>{email}</strong>. It works once and expires in 15 minutes.
      </p>
    );
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={submit}>
      <label htmlFor="magic-email" className="sr-only">Email address</label>
      <input id="magic-email" type="email" required autoComplete="email" className="input-planner" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <button type="submit" disabled={state === "sending"} className="button-base button-secondary button-lg w-full">
        <Mail size={15} /> {state === "sending" ? "Sending…" : "Email me a sign-in link"}
      </button>
      {state === "error" && <p role="alert" className="text-left text-xs text-danger">We couldn&apos;t send that link. Wait a few minutes and try again.</p>}
    </form>
  );
}
