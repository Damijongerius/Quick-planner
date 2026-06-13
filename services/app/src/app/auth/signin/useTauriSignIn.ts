import { useState, useRef, useEffect } from "react";
import { useAuth, API_BASE_URL } from "@/context/AuthContext";

const WEB_URL = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3003";

export function useTauriSignIn(sessionId: string | null) {
  const [isTauri, setIsTauri] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isAutoCompleting, setIsAutoCompleting] = useState(false);
  const [tauriError, setTauriError] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const { login, token, user } = useAuth();

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      setIsTauri(true);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    // If the browser already has an active session and we were opened with a sessionId,
    // we can immediately complete the Tauri session and show the success screen!
    if (token && user && sessionId && !isTauri) {
      setIsAutoCompleting(true);
      const completeSession = async () => {
        try {
          await fetch(`${API_BASE_URL}/auth/session/complete`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId, token, user }),
          });
          // Redirect browser to callback page which will show the "success" view
          window.location.href = `/auth/callback?token=${token}&user=${encodeURIComponent(
            JSON.stringify(user)
          )}&sessionId=${sessionId}`;
        } catch (err) {
          console.error("Failed to complete session automatically:", err);
          setIsAutoCompleting(false);
        }
      };
      completeSession();
    }
  }, [token, user, sessionId, isTauri]);

  const handleTauriSignIn = async () => {
    try {
      setTauriError(null);
      setIsWaiting(true);

      const targetSessionId = window.crypto?.randomUUID?.() || 
        Math.random().toString(36).substring(2) + Date.now().toString(36);

      const targetUrl = `${WEB_URL}/auth/signin?sessionId=${targetSessionId}`;

      // Open URL in system default browser using Tauri custom command
      if (typeof window !== "undefined" && (window as any).__TAURI__) {
        await (window as any).__TAURI__.core.invoke("open_url", { url: targetUrl });
      } else {
        window.open(targetUrl, "_blank");
      }

      // Start polling
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/auth/session/poll/${targetSessionId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === "success" && data.token && data.user) {
              if (pollingRef.current) clearInterval(pollingRef.current);
              setIsWaiting(false);
              login(data.token, data.user);
            }
          }
        } catch (err) {
          console.error("Error polling auth status:", err);
        }
      }, 1500);

      // Auto-cancel after 5 minutes
      setTimeout(() => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          setIsWaiting(false);
          setTauriError("Login timed out. Please try again.");
        }
      }, 5 * 60 * 1000);

    } catch (err: any) {
      console.error("Failed to initiate Tauri login:", err);
      setTauriError("Failed to open web browser. Please try again.");
      setIsWaiting(false);
    }
  };

  const handleCancelTauriSignIn = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsWaiting(false);
  };

  return {
    isTauri,
    isWaiting,
    isAutoCompleting,
    tauriError,
    handleTauriSignIn,
    handleCancelTauriSignIn
  };
}
