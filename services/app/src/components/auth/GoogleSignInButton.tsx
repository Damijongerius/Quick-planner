"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function GoogleSignInButton() {
  return (
    <Button
      onClick={() => signIn("google", { callbackUrl: "/projects" })}
    >
      <div className="flex items-center gap-lg relative z-10">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md transform group-hover:scale-105 transition-transform duration-300">
                <svg width="20" height="20" viewBox="0 0 18 18" className="shrink-0">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285f4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34a853"/>
                    <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.712s.102-1.172.282-1.712V4.956H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.044l3.007-2.332z" fill="#fbbc05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.443 2.117.957 5.156l3.007 2.332C4.672 5.164 6.656 3.58 9 3.58z" fill="#ea4335"/>
                </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">Continue with Google</span>
        </div>
    </Button>
  );
}
