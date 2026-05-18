import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LegacyMigrationForm() {
  const [showLegacy, setShowLegacy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="legacy-migration-container">
      {showLegacy ? (
        <MigrationForm 
          email={email} 
          setEmail={setEmail} 
          password={password} 
          setPassword={setPassword} 
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleLegacyAuthentication(e, email, password)} 
        />
      ) : (
        <MigrationToggle onActivate={() => setShowLegacy(true)} />
      )}
    </div>
  );
}

// --- Implementation Details (The Prose) ---

function handleLegacyAuthentication(e: React.FormEvent<HTMLFormElement>, email: string, password: string) {
  e.preventDefault();
  performLegacySignIn(email, password);
}

function MigrationToggle({ onActivate }: Readonly<{ onActivate: () => void }>) {
  return (
    <Button 
      onClick={onActivate}
      variant="ghost"
    >
      Utilize Legacy Migration
    </Button>
  );
}

interface MigrationFormProps {
  readonly email: string;
  readonly setEmail: (email: string) => void;
  readonly password: string;
  readonly setPassword: (password: string) => void;
  readonly onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

function MigrationForm({ email, setEmail, password, setPassword, onSubmit }: MigrationFormProps) {
  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={onSubmit}
      className="text-left bg-surface-container-low p-xl rounded-3xl border border-outline-variant shadow-sm mt-lg"
    >
      <div className="mb-lg">
        <label className="text-meta flex items-center gap-sm mb-md opacity-40 uppercase tracking-widest text-[10px]">
          <Mail size={12} /> Master Credentials
        </label>
        <input 
          type="email" 
          className="input-planner w-full" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="strategic.visionary@planner.io"
          required 
        />
      </div>
      <div className="mb-xl">
        <label className="text-meta flex items-center gap-sm mb-md opacity-40 uppercase tracking-widest text-[10px]">
          <Lock size={12} /> Security Key
        </label>
        <input 
          type="password" 
          className="input-planner w-full" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required 
        />
      </div>
      <button type="submit" className="button-planner w-full flex items-center justify-center gap-md h-12">
        <LogIn size={18} /> INITIALIZE ACCESS
      </button>
    </motion.form>
  );
}

async function performLegacySignIn(email: string, password: string) {
  await signIn("credentials", {
    email,
    password,
    callbackUrl: "/projects",
  });
}

