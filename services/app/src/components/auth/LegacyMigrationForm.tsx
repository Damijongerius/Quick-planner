import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ChevronDown } from "lucide-react";

export function LegacyMigrationForm() {
  const [showLegacy, setShowLegacy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="legacy-migration-container">
      {!showLegacy ? (
        <MigrationToggle onActivate={() => setShowLegacy(true)} />
      ) : (
        <MigrationForm 
          email={email} 
          setEmail={setEmail} 
          password={password} 
          setPassword={setPassword} 
          onSubmit={(e: React.FormEvent) => handleLegacyAuthentication(e, email, password)} 
        />
      )}
    </div>
  );
}

// --- Implementation Details (The Prose) ---

function handleLegacyAuthentication(e: React.FormEvent, email: string, password: any) {
  e.preventDefault();
  performLegacySignIn(email, password);
}

function MigrationToggle({ onActivate }: { onActivate: () => void }) {
  return (
    <button 
      onClick={onActivate}
      className="button-secondary mx-auto px-lg py-sm text-xs text-on-surface-variant flex items-center gap-xs rounded-full"
    >
      Legacy Migration <ChevronDown size={14} />
    </button>
  );
}

function MigrationForm({ email, setEmail, password, setPassword, onSubmit }: any) {
  return (
    <motion.form 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      onSubmit={onSubmit}
      className="text-left"
    >
      <div className="mb-lg">
        <label className="text-meta flex items-center gap-sm mb-sm opacity-60">
          <Mail size={14} /> Email
        </label>
        <input 
          type="email" 
          className="input-premium" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required 
        />
      </div>
      <div className="mb-xl">
        <label className="text-meta flex items-center gap-sm mb-sm opacity-60">
          <Lock size={14} /> Password
        </label>
        <input 
          type="password" 
          className="input-premium" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required 
        />
      </div>
      <button type="submit" className="button-premium w-full bg-on-surface text-surface flex items-center justify-center gap-md">
        <LogIn size={18} /> Authenticate
      </button>
    </motion.form>
  );
}

async function performLegacySignIn(email: string, password: any) {
  await signIn("credentials", {
    email,
    password,
    callbackUrl: "/projects",
  });
}

