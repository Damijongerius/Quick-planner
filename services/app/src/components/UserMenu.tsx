"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { LogOut, Power } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { WakePcModal } from "./WakePcModal";
import { NotificationBell } from "./NotificationBell";

export function UserMenu() {
  const { data: session } = useSession();
  const [isWakeModalOpen, setIsWakeModalOpen] = useState(false);

  if (!session?.user) return null;

  const isDamian = session.user.email === "damianojongerius@gmail.com";

  return (
    <>
      <div className="flex items-center gap-2 rounded-lg p-1.5">
        <Link href="/profile" className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md p-1 text-left hover:bg-hover" title="Account">
          <Avatar src={session.user.image} name={session.user.name} size="md" />
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium text-fg">{session.user.name}</span>
            <span className="truncate text-xs text-faint">{session.user.email}</span>
          </span>
        </Link>
        {isDamian && (
          <button type="button" className="icon-button" title="Wake PC" aria-label="Wake PC" onClick={() => setIsWakeModalOpen(true)}>
            <Power size={16} />
          </button>
        )}
        <NotificationBell />
        <ThemeToggle />
        <button
          type="button"
          className="icon-button hover:!text-danger"
          title="Sign out"
          aria-label="Sign out"
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
        >
          <LogOut size={16} />
        </button>
      </div>

      {isDamian && <WakePcModal isOpen={isWakeModalOpen} onClose={() => setIsWakeModalOpen(false)} />}
    </>
  );
}
