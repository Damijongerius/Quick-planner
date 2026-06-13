"use client";

import React, { useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, UserPlus, User } from "lucide-react";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";

export function LegacyMigrationForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = isSignUp ? "/auth/signup" : "/auth/login";
    const body = isSignUp ? { email, password, name } : { email, password };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      if (sessionId) {
        // Send token to backend session cache
        await fetch(`${API_BASE_URL}/auth/session/complete`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sessionId,
            token: data.token,
            user: data.user,
          }),
        });

        // Redirect browser to callback page which will show the "success" view
        window.location.href = `/auth/callback?token=${data.token}&user=${encodeURIComponent(
          JSON.stringify(data.user)
        )}&sessionId=${sessionId}`;
      } else {
        login(data.token, data.user);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-md">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-error text-sm bg-error/10 p-md rounded-xl border border-error/20 text-center"
        >
          {error}
        </motion.div>
      )}

      <form 
        onSubmit={handleSubmit}
        className="text-left bg-surface-container-low p-xl rounded-3xl border border-outline-variant shadow-sm w-full"
      >
        <h2 className="text-xl font-bold tracking-tight mb-xl text-center">
          {isSignUp ? "Create Account" : "Access your Planner"}
        </h2>

        {isSignUp && (
          <div className="mb-lg">
            <label className="text-meta flex items-center gap-sm mb-md opacity-40 uppercase tracking-widest text-[10px]">
              <User size={12} /> Name
            </label>
            <input 
              type="text" 
              className="input-planner w-full" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Damian Jongerius"
              required 
              disabled={loading}
            />
          </div>
        )}

        <div className="mb-lg">
          <label className="text-meta flex items-center gap-sm mb-md opacity-40 uppercase tracking-widest text-[10px]">
            <Mail size={12} /> Email Address
          </label>
          <input 
            type="email" 
            className="input-planner w-full" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="damianojongerius@gmail.com"
            required 
            disabled={loading}
          />
        </div>

        <div className="mb-xl">
          <label className="text-meta flex items-center gap-sm mb-md opacity-40 uppercase tracking-widest text-[10px]">
            <Lock size={12} /> Password
          </label>
          <input 
            type="password" 
            className="input-planner w-full" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required 
            disabled={loading}
          />
        </div>

        <button 
          type="submit" 
          className="button-planner w-full flex items-center justify-center gap-md h-12 text-white font-bold" 
          style={{ background: "var(--primary)", border: "none", cursor: "pointer", borderRadius: "12px" }}
          disabled={loading}
        >
          {loading ? "PROCESSING..." : isSignUp ? "INITIALIZE ACCOUNT" : "INITIALIZE ACCESS"}
        </button>
      </form>

      <div className="text-center mt-md">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setError(null);
          }}
          className="text-xs text-primary hover:underline font-bold"
          style={{ background: "none", border: "none", cursor: "pointer" }}
        >
          {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
        </button>
      </div>
    </div>
  );
}
