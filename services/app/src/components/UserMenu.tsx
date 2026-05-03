"use client";

import { useSession, signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";
import Image from "next/image";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '16px', background: 'var(--surface-container-low)' }}>
      {session.user.image ? (
        <Image src={session.user.image} alt={session.user.name || "User"} width={40} height={40} style={{ borderRadius: '12px' }} />
      ) : (
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <User size={20} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--on-surface)' }}>{session.user.name}</span>
        <span style={{ fontSize: '11px', color: 'var(--on-surface-variant)' }}>{session.user.email}</span>
      </div>
      <button 
        onClick={() => signOut({ callbackUrl: '/auth/signin' })}
        className="button-secondary"
        style={{ padding: '8px', borderRadius: '10px' }}
        title="Sign Out"
      >
        <LogOut size={16} />
      </button>
    </div>
  );
}
