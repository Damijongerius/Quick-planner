"use client";

import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

export default function SignInPage() {
  const handleGoogleSignIn = async () => {
    await signIn("google", {
      callbackUrl: "/projects",
    });
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw', position: 'fixed', top: 0, left: 0, background: '#0a0a0c', zIndex: 2000 }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ padding: '48px', width: '400px' }}
      >
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', textAlign: 'center', background: 'linear-gradient(to right, #3b82f6, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Quick Planner
        </h1>
        <p style={{ textAlign: 'center', color: '#9ca3af', marginBottom: '32px' }}>Welcome back. Organize your vision.</p>
        
        <button onClick={handleGoogleSignIn} className="button-premium" style={{ width: '100%', padding: '14px' }}>
          Sign In with Google
        </button>
      </motion.div>
    </div>
  );
}
