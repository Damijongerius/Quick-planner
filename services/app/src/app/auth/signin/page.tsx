"use client";

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
    <div className="flex items-center justify-center" style={{ minHeight: '100vh', width: '100vw', background: 'var(--surface)', position: 'relative', overflow: 'hidden' }}>
      {/* Abstract Background Decoration */}
      <div style={{ 
        position: 'absolute', 
        top: '-10%', 
        right: '-10%', 
        width: '800px', 
        height: '800px', 
        background: 'radial-gradient(circle, rgba(70, 86, 184, 0.08) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0 
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '-10%', 
        left: '-10%', 
        width: '800px', 
        height: '800px', 
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.08) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0 
      }} />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ 
          padding: 'var(--spacing-xxl)', 
          width: '100%',
          maxWidth: '480px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          borderRadius: '40px',
          margin: '24px'
        }}
      >
        <AuthLogo />

        <AnimatePresence>
          {error && <AuthErrorBanner error={error} />}
        </AnimatePresence>
        
        <div className="mb-2xl">
            <h2 className="text-3xl font-bold tracking-tight mb-sm">
                Welcome Back
            </h2>
            <p className="text-secondary">
                The next evolution of strategic coordination.
            </p>
        </div>
        
        <GoogleSignInButton />
        <LegacyMigrationForm />
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
