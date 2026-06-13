"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { token, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (token) {
      router.push("/projects");
    } else {
      router.push("/auth/signin");
    }
  }, [token, loading, router]);

  return (
    <div style={{ 
      padding: "24px", 
      fontFamily: "var(--font-inter), sans-serif", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      backgroundColor: "var(--surface)",
      color: "var(--on-surface)"
    }}>
      <p style={{ opacity: 0.6, fontSize: "16px" }}>Redirecting to secure area...</p>
    </div>
  );
}
