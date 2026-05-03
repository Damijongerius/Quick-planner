"use client";

import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ShieldAlert } from "lucide-react";

export function MigrationGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const isMigrated = (session?.user as any)?.isMigrated;
  const showMigration = status === "authenticated" && !isMigrated;

  return (
    <>
      <AnimatePresence>
        {showMigration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              backgroundColor: 'rgba(10, 10, 12, 0.95)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass"
              style={{
                maxWidth: '500px',
                width: '100%',
                padding: '48px',
                textAlign: 'center',
                border: '1px solid var(--primary)',
                boxShadow: '0 0 80px rgba(70, 86, 184, 0.2)'
              }}
            >
              <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '24px', 
                backgroundColor: 'rgba(70, 86, 184, 0.1)', 
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 32px'
              }}>
                <ShieldAlert size={40} />
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '16px', color: 'var(--on-surface)' }}>
                Authentication Upgrade Required
              </h2>
              
              <p style={{ color: 'var(--on-surface-variant)', lineHeight: 1.6, marginBottom: '40px' }}>
                We are transitioning to Google-only authentication for enhanced security. 
                To continue using Quick Planner, you must link your Google account to your existing profile.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <button 
                  onClick={() => signIn("google", { callbackUrl: window.location.href })}
                  className="button-premium"
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px'
                  }}
                >
                  <Sparkles size={20} />
                  Connect Google Account
                  <ArrowRight size={18} />
                </button>
                
                <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', opacity: 0.6 }}>
                  Your project data will be preserved and linked to your Google login.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}
