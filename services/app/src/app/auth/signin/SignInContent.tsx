"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { DevSignInButton } from "@/components/auth/DevSignInButton";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { GitHubSignInButton } from "@/components/auth/GitHubSignInButton";
import { EmailSignInForm } from "@/components/auth/EmailSignInForm";
import type { ProviderFlags } from "@/lib/mail/config";

function SignInContent({ providers, devEmail }: Readonly<{ providers: ProviderFlags; devEmail: string }>) {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") || "/projects";
  const checkEmail = searchParams.get("check") === "email";

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-sm rounded-xl border border-border bg-panel p-8 text-center shadow-lg"
      >
        <div className="mb-7 flex flex-col items-center">
          <AuthLogo />
        </div>

        <AnimatePresence>{error && <AuthErrorBanner error={error} />}</AnimatePresence>

        {checkEmail && (
          <p role="status" className="mb-5 rounded-lg border border-success/30 bg-success-soft px-3 py-2.5 text-left text-sm text-success">
            Check your inbox. We sent you a sign-in link.
          </p>
        )}

        <div className="flex flex-col gap-2.5">
          {providers.google && <GoogleSignInButton callbackUrl={callbackUrl} />}
          {providers.github && <GitHubSignInButton callbackUrl={callbackUrl} />}
        </div>

        {providers.email && (
          <>
            {(providers.google || providers.github) && <Divider>or use your email</Divider>}
            <EmailSignInForm callbackUrl={callbackUrl} />
          </>
        )}

        {providers.dev && (
          <>
            <Divider>local development</Divider>
            <DevSignInButton defaultEmail={devEmail} callbackUrl={callbackUrl} />
          </>
        )}

        {!providers.google && !providers.github && !providers.email && !providers.dev && (
          <p className="text-sm text-muted">No sign-in method is configured. Set up Google, GitHub or SMTP in the environment (see the README).</p>
        )}

        {providers.google && <p className="mt-5 text-xs text-faint">Already had an account? Sign in with the Google account that uses the same email address.</p>}
      </motion.div>
    </main>
  );
}

function Divider({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="my-4 flex items-center gap-3 text-xs text-faint">
      <span className="h-px flex-1 bg-border" /> {children} <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function SignInForm({ providers, devEmail }: Readonly<{ providers: ProviderFlags; devEmail: string }>) {
  return (
    <Suspense fallback={null}>
      <SignInContent providers={providers} devEmail={devEmail} />
    </Suspense>
  );
}
