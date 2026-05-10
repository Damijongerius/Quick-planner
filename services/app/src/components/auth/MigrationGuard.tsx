"use client";

import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ArrowRight, ShieldAlert } from "lucide-react";

export function MigrationGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const showMigration = shouldShowMigrationGate(session, status);

  return (
    <>
      <AnimatePresence>
        {showMigration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="migration-guard-overlay"
          >
            <UpgradeRequiredCard onAction={handleGoogleMigration} />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </>
  );
}

// --- Implementation Details (The Prose) ---

function handleGoogleMigration() {
  signIn("google", { callbackUrl: window.location.href });
}

function UpgradeRequiredCard({ onAction }: { onAction: () => void }) {
  return (
    <motion.div
      initial={{ scale: 0.9, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      className="glass migration-guard-card"
    >
      <div className="migration-guard-icon-box">
        <ShieldAlert size={40} />
      </div>

      <h2 className="migration-guard-title">
        Authentication Upgrade Required
      </h2>
      
      <p className="migration-guard-description">
        We are transitioning to Google-only authentication for enhanced security. 
        To continue using Quick Planner, you must link your Google account to your existing profile.
      </p>

      <div className="flex flex-col gap-lg">
        <button 
          onClick={onAction}
          className="button-sanctuary w-full p-lg text-lg flex items-center justify-center gap-md"
        >
          <Sparkles size={20} />
          Connect Google Account
          <ArrowRight size={18} />
        </button>
        
        <p className="text-xs text-on-surface-variant opacity-60">
          Your project data will be preserved and linked to your Google login.
        </p>
      </div>
    </motion.div>
  );
}

function shouldShowMigrationGate(session: any, status: string) {
  const isMigrated = (session?.user as any)?.isMigrated;
  return status === "authenticated" && !isMigrated;
}

