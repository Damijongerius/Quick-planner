import { signIn } from "next-auth/react";
import { Sparkles } from "lucide-react";

export function GoogleSignInButton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '48px' }}>
      <button 
        onClick={() => signIn("google", { callbackUrl: "/projects" })}
        className="button-premium" 
        style={{ 
          width: '100%', 
          padding: '18px', 
          fontSize: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: 'var(--primary-shadow)'
        }}
      >
        <Sparkles size={20} />
        Continue with Google
      </button>
      <p className="text-meta" style={{ fontSize: '10px', opacity: 0.4 }}>
        SECURE AUTHENTICATION REQUIRED
      </p>
    </div>
  );
}
