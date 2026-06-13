"use client";
import "./Sidebar.css";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";
import { WakePcModal } from "./WakePcModal";
import { useAuth } from "@/context/AuthContext";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isWakeModalOpen, setIsWakeModalOpen] = useState(false);

  if (!user) return null;

  const isDamian = user.email === "damianojongerius@gmail.com";

  return (
    <>
    <div className="user-menu-wrapper px-sm pb-sm">
      <div className="user-menu-container relative group">
        <div 
          className={`flex items-center gap-3 flex-1 ${isDamian ? 'cursor-pointer' : ''}`}
          onClick={() => isDamian && setIsWakeModalOpen(true)}
          role={isDamian ? "button" : undefined}
          tabIndex={isDamian ? 0 : undefined}
          aria-label={isDamian ? "Open Wake PC Menu" : undefined}
        >
          <Avatar 
            src={user.image} 
            name={user.name} 
            size="md" 
          />
          <div className="user-info text-left pr-8">
            <span className="user-name">
                {user.name}
            </span>
            <span className="user-email text-[11px] text-on-surface-variant">
                {user.email}
            </span>
          </div>
        </div>
        <Button 
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); logout(); }}
          title="Sign Out"
          className="!p-0 w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center shrink-0 !text-on-surface-variant hover:!text-error hover:!bg-error/10 transition-colors"
        >
          <LogOut size={16} />
        </Button>
      </div>
    </div>

      {isDamian && (
        <WakePcModal isOpen={isWakeModalOpen} onClose={() => setIsWakeModalOpen(false)} />
      )}
    </>
  );
}
