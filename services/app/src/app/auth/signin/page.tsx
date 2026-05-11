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
    <div className="flex items-center justify-center relative overflow-hidden" style={{ minHeight: '100vh', width: '100vw', background: '#0a0a0c' }}>
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(70,86,184,0.15)_0%,rgba(0,0,0,0)_70%)]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(147,51,234,0.12)_0%,rgba(0,0,0,0)_70%)]" />
        <div className="absolute top-[20%] left-[10%] w-[40vw] h-[40vw] bg-[radial-gradient(circle,rgba(56,189,248,0.08)_0%,rgba(0,0,0,0)_70%)]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "circOut" }}
        className="glass-dark"
        style={{ 
          padding: '48px', 
          width: '100%',
          maxWidth: '440px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          borderRadius: '40px',
          margin: '24px',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)'
        }}
      >
        <div className="mb-2xl flex justify-center">
            <AuthLogo />
        </div>

        <AnimatePresence>
          {error && <AuthErrorBanner error={error} />}
        </AnimatePresence>
        
        <div className="mb-2xl">
            <h2 className="text-editorial text-4xl font-bold tracking-tight mb-md text-white">
                Welcome Back
            </h2>
            <p className="text-meta text-xs opacity-50 uppercase tracking-[0.2em]">
                Strategic Governance Interface
            </p>
        </div>
        
        <GoogleSignInButton />

        <div className="relative my-xl">
            <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                <span className="bg-[#161618] px-md text-white/20">or utilize legacy migration</span>
            </div>
        </div>

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
