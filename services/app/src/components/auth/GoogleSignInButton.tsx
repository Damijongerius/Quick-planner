import { signIn } from "next-auth/react";
import { Sparkles } from "lucide-react";

export function GoogleSignInButton() {
  return (
    <div className="flex flex-col gap-lg mb-2xl">
      <button 
        onClick={() => signIn("google", { callbackUrl: "/projects" })}
        className="button-premium w-full" 
      >
        <Sparkles size={20} />
        Continue with Google
      </button>
      <p className="text-meta opacity-30" style={{ fontSize: '10px' }}>
        SECURE AUTHENTICATION REQUIRED
      </p>
    </div>
  );
}
