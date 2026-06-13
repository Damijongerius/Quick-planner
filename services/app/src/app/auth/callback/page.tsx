"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const loginCalled = useRef(false);
  const [isDesktopSuccess, setIsDesktopSuccess] = useState(false);

  useEffect(() => {
    if (loginCalled.current) return;

    const token = searchParams.get("token");
    const userStr = searchParams.get("user");
    const sessionId = searchParams.get("sessionId");

    if (token && userStr) {
      try {
        loginCalled.current = true;
        const user = JSON.parse(userStr);

        if (sessionId) {
          // Log in on the browser too by setting local storage directly
          localStorage.setItem("qp_token", token);
          localStorage.setItem("qp_user", JSON.stringify(user));
          setIsDesktopSuccess(true);
        } else {
          login(token, user);
        }
      } catch (error) {
        console.error("Failed to parse Google OAuth user:", error);
        router.push("/auth/signin?error=InvalidCallbackData");
      }
    } else {
      console.error("Missing token or user in Google OAuth callback");
      router.push("/auth/signin?error=MissingCallbackData");
    }
  }, [searchParams, login, router]);

  return (
    <div className="flex items-center justify-center relative overflow-hidden" style={{ minHeight: '100vh', width: '100vw', background: 'var(--surface)' }}>
      {/* Mesh Gradient Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(70,86,184,0.08)_0%,rgba(0,0,0,0)_70%)]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[80vw] h-[80vw] bg-[radial-gradient(circle,rgba(147,51,234,0.05)_0%,rgba(0,0,0,0)_70%)]" />
      </div>

      <div 
        className="glass flex flex-col items-center justify-center gap-xl"
        style={{ 
          padding: '48px', 
          width: '100%',
          maxWidth: '440px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
          borderRadius: '40px',
          margin: '24px',
          border: '1px solid var(--outline-variant)',
          boxShadow: 'var(--ambient-shadow)'
        }}
      >
        {isDesktopSuccess ? (
          <div className="flex flex-col items-center gap-lg">
            <div 
              style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                marginBottom: '16px'
              }}
            >
              ✓
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--foreground)' }}>Login Successful!</h2>
            <p style={{ fontSize: '15px', color: 'var(--muted)', lineHeight: '1.6' }}>
              You have successfully signed in. You can now close this browser tab and return to your QuickPlanner desktop application.
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-lg">
            {/* Elegant Circular Loading Animation */}
            <div 
              className="animate-spin" 
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                border: '3px solid var(--outline-variant)', 
                borderTopColor: 'var(--primary)',
              }}
            />
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--foreground)' }}>Signing in...</h2>
            <p style={{ fontSize: '14px', color: 'var(--muted)' }}>Completing Google authentication. Please wait.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center" style={{ minHeight: '100vh', width: '100vw', background: 'var(--surface)' }}>
        <p style={{ color: 'var(--muted)' }}>Loading authentication context...</p>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  );
}
