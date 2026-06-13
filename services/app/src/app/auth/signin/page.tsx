"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { LegacyMigrationForm } from "@/components/auth/LegacyMigrationForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { useTauriSignIn } from "./useTauriSignIn";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const sessionId = searchParams.get("sessionId");

  const {
    isTauri,
    isWaiting,
    isAutoCompleting,
    tauriError,
    handleTauriSignIn,
    handleCancelTauriSignIn
  } = useTauriSignIn(sessionId);

  return (
    <div className="flex items-center justify-center relative overflow-hidden" style={{ minHeight: '100vh', width: '100vw', background: 'var(--surface)' }}>
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(70,86,184,0.08)_0%,rgba(0,0,0,0)_70%)]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(147,51,234,0.05)_0%,rgba(0,0,0,0)_70%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="glass"
        style={{ 
          padding: '48px', 
          width: '100%',
          maxWidth: '440px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          borderRadius: '40px',
          margin: '24px',
          border: '1px solid var(--outline-variant)',
          boxShadow: 'var(--ambient-shadow)'
        }}
      >
        <div className="mb-2xl flex flex-col items-center">
            <AuthLogo />
        </div>

        <AnimatePresence>
          {(error || tauriError) && (
            <AuthErrorBanner error={error || tauriError || ""} />
          )}
        </AnimatePresence>
        
        {isAutoCompleting ? (
          <div className="flex flex-col items-center gap-lg">
            <Loader2 className="animate-spin text-primary" size={40} style={{ color: 'var(--primary)' }} />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)' }}>
              Connecting to app...
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
              Completing login on your desktop application.
            </p>
          </div>
        ) : isTauri ? (
          <div className="flex flex-col gap-xl">
            {isWaiting ? (
              <div className="flex flex-col items-center gap-lg">
                <Loader2 className="animate-spin text-primary" size={40} style={{ color: 'var(--primary)' }} />
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)' }}>
                  Waiting for Browser...
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)' }}>
                  Please complete the sign in process in the browser window that just opened.
                </p>
                <button
                  onClick={handleCancelTauriSignIn}
                  className="button-planner w-full mt-md text-white font-bold h-12"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--outline-variant)", cursor: "pointer", borderRadius: "12px" }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-lg">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mb-md" style={{ background: 'rgba(var(--primary-rgb), 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={32} />
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
                  Sign in to Desktop App
                </h2>
                <p style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5', marginBottom: '8px' }}>
                  To keep your credentials secure, authentication takes place in your system default web browser.
                </p>
                <button 
                  onClick={handleTauriSignIn}
                  className="button-planner w-full flex items-center justify-center gap-md h-12 text-white font-bold" 
                  style={{ background: "var(--primary)", border: "none", cursor: "pointer", borderRadius: "12px" }}
                >
                  <ExternalLink size={18} />
                  <span>SIGN IN IN BROWSER</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-xl">
              <GoogleSignInButton />

              <div className="flex items-center" style={{ margin: '16px 0' }}>
                <div style={{ flexGrow: 1, borderTop: '1px solid var(--outline-variant)' }} />
                <span style={{ padding: '0 16px', fontSize: '14px', color: 'var(--muted)', fontWeight: 500 }}>or</span>
                <div style={{ flexGrow: 1, borderTop: '1px solid var(--outline-variant)' }} />
              </div>

              <LegacyMigrationForm />
          </div>
        )}

      </motion.div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={null}>
      <SignInContent />
    </Suspense>
  );
}
