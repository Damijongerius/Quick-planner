"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Load auth details from localStorage on mount
    const storedToken = localStorage.getItem("qp_token");
    const storedUser = localStorage.getItem("qp_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Simple route guard check client-side
  useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname?.startsWith("/auth");
    const isPublicPage = pathname === "/" || isAuthPage;

    if (!token && !isPublicPage) {
      router.push("/auth/signin");
    } else if (token && isAuthPage) {
      // If there is a sessionId query parameter, do not redirect to /projects.
      // The signin/callback pages will handle session completion for Tauri.
      const searchParams = new URLSearchParams(window.location.search);
      const sessionId = searchParams.get("sessionId");
      if (!sessionId) {
        router.push("/projects");
      }
    }
  }, [token, loading, pathname, router]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("qp_token", newToken);
    localStorage.setItem("qp_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    router.push("/projects");
  };

  const logout = () => {
    localStorage.removeItem("qp_token");
    localStorage.removeItem("qp_user");
    setToken(null);
    setUser(null);
    router.push("/auth/signin");
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Global fetch helper that automatically appends JWT token
export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = localStorage.getItem("qp_token");
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = "API Request failed";
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.error || errorMsg;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  // Handle empty or text responses
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}
