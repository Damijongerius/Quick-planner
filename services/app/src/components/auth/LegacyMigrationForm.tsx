import { useState } from "react";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, ChevronDown } from "lucide-react";

export function LegacyMigrationForm() {
  const [showLegacy, setShowLegacy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/projects",
    });
  };

  return (
    <div style={{ borderTop: '1px solid var(--outline-variant)', paddingTop: '32px' }}>
      {!showLegacy ? (
        <button 
          onClick={() => setShowLegacy(true)}
          className="button-secondary"
          style={{ 
            margin: '0 auto',
            padding: '10px 20px',
            fontSize: '13px',
            color: 'var(--on-surface-variant)'
          }}
        >
          Legacy Migration <ChevronDown size={14} />
        </button>
      ) : (
        <motion.form 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={handleSubmit}
          style={{ textAlign: 'left' }}
        >
          <div style={{ marginBottom: '20px' }}>
            <label className="text-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Mail size={14} /> Email
            </label>
            <input 
              type="email" 
              className="input-premium" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required 
              style={{ paddingLeft: '20px' }}
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label className="text-meta" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <Lock size={14} /> Password
            </label>
            <input 
              type="password" 
              className="input-premium" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
              style={{ paddingLeft: '20px' }}
            />
          </div>
          <button type="submit" className="button-premium" style={{ width: '100%', background: 'var(--on-surface)', color: 'var(--surface)' }}>
            <LogIn size={18} /> Authenticate
          </button>
        </motion.form>
      )}
    </div>
  );
}
