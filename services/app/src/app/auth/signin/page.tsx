"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthLogo } from "@/components/auth/AuthLogo";
import { AuthErrorBanner } from "@/components/auth/AuthErrorBanner";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { LegacyMigrationForm } from "@/components/auth/LegacyMigrationForm";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

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
          {error && <AuthErrorBanner error={error} />}
        </AnimatePresence>
        
        <div className="flex flex-col gap-xl">

            <GoogleSignInButton />

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-outline-variant/30"></div>
                </div>
            </div>

            <LegacyMigrationForm />

        </div>

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
