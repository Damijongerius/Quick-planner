"use client";
import "./Sidebar.css";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { WakePcModal } from "./WakePcModal";

export function UserMenu() {
  const { data: session } = useSession();
  const [isWakeModalOpen, setIsWakeModalOpen] = useState(false);

  if (!session?.user) return null;

  const isDamian = session.user.email === "damianojongerius@gmail.com";

  return (
    <>
      <div 
        className={`user-menu-container ${isDamian ? 'cursor-pointer hover:bg-surface-container-high transition-colors' : ''}`}
        onClick={() => isDamian && setIsWakeModalOpen(true)}
      >
        <Avatar 
          src={session.user.image} 
          name={session.user.name} 
          size="md" 
        />
        <div className="user-info">
          <span className="user-name">
              {session.user.name}
          </span>
          <span className="user-email">
              {session.user.email}
          </span>
        </div>
        <Button 
          variant="ghost" 
          onClick={(e) => { e.stopPropagation(); handleUserSignOut(); }}
          title="Sign Out"
          size="sm"
        >
          <LogOut size={16} />
        </Button>
      </div>

      {isDamian && (
        <WakePcModal isOpen={isWakeModalOpen} onClose={() => setIsWakeModalOpen(false)} />
      )}
    </>
  );
}

function handleUserSignOut() {
  signOut({ callbackUrl: '/auth/signin' });
}
