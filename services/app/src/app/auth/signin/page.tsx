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
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh', 
      width: '100vw', 
      background: 'var(--surface)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Abstract Background Decoration */}
      <div style={{ 
        position: 'absolute', 
        top: '-10%', 
        right: '-10%', 
        width: '600px', 
        height: '600px', 
        background: 'radial-gradient(circle, rgba(70, 86, 184, 0.05) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0 
      }} />
      <div style={{ 
        position: 'absolute', 
        bottom: '-10%', 
        left: '-10%', 
        width: '600px', 
        height: '600px', 
        background: 'radial-gradient(circle, rgba(147, 51, 234, 0.05) 0%, rgba(255,255,255,0) 70%)',
        zIndex: 0 
      }} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass"
        style={{ 
          padding: '64px', 
          width: '500px', 
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          border: '1px solid var(--outline-variant)',
          borderRadius: '32px'
        }}
      >
        <AuthLogo />

        <AnimatePresence>
          {error && <AuthErrorBanner error={error} />}
        </AnimatePresence>
        
        <div style={{ marginBottom: '48px' }}>
            <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--on-surface)', marginBottom: '12px' }}>
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
