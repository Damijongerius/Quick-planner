"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function SignInPage() {
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
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: '#9ca3af' }}>Email Address</label>
            <input 
              type="email" 
              className="input-premium" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required 
            />
          </div>
          <div style={{ marginBottom: '32px' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: '#9ca3af' }}>Password</label>
            <input 
              type="password" 
              className="input-premium" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required 
            />
          </div>
          <button type="submit" className="button-premium" style={{ width: '100%', padding: '14px' }}>
            Sign In
          </button>
        </form>
        
        <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#4b5563' }}>
          New here? Just enter your details to create an account.
        </p>
      </motion.div>
    </div>
  );
}
