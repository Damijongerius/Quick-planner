"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import "../ui/Button.css";

/** Local development only. Type any email to sign in as that user (created on first use). */
export function DevSignInButton({ defaultEmail, callbackUrl }: Readonly<{ defaultEmail: string; callbackUrl: string }>) {
  const [email, setEmail] = useState(defaultEmail);

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        signIn("dev-login", { email, callbackUrl });
      }}
    >
      <label htmlFor="dev-email" className="sr-only">Email for local sign-in</label>
      <input id="dev-email" type="email" required className="input-planner" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
      <button type="submit" className="button-base button-secondary button-lg w-full">Continue as local dev user</button>
    </form>
  );
}
