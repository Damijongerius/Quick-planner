"use client";

import { useSession, signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { Button } from "./ui/Button";

export function UserMenu() {
  const { data: session } = useSession();

  if (!session?.user) return null;

  return (
    <div className="user-menu-container">
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
        onClick={handleUserSignOut}
        title="Sign Out"
        size="sm"
      >
        <LogOut size={16} />
      </Button>
    </div>
  );
}

function handleUserSignOut() {
  signOut({ callbackUrl: '/auth/signin' });
}
