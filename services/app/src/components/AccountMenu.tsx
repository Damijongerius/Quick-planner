"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { LogOut, UserRound } from "lucide-react";
import { Avatar } from "./ui/Avatar";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./NotificationBell";

/** Avatar button with a small dropdown. Used on pages outside a project (no sidebar). */
export function AccountMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session?.user) return <div className="h-8 w-8" />;

  return (
    <div className="flex items-center gap-2">
    <NotificationBell placement="down" />
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open} aria-label="Account menu" className="rounded-full ring-offset-2 ring-offset-bg transition-shadow hover:ring-2 hover:ring-border-strong">
        <Avatar src={session.user.image} name={session.user.name} size="md" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 animate-pop-in rounded-lg border border-border bg-panel p-1 shadow-lg">
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium">{session.user.name}</p>
            <p className="truncate text-xs text-faint">{session.user.email}</p>
          </div>
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className="mt-1 flex h-8 items-center gap-2 rounded-md px-2.5 text-sm hover:bg-hover">
            <UserRound size={14} /> Account
          </Link>
          <div className="flex h-8 items-center justify-between rounded-md px-2.5 text-sm">
            <span>Theme</span>
            <ThemeToggle />
          </div>
          <button role="menuitem" onClick={() => signOut({ callbackUrl: "/auth/signin" })} className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-hover hover:text-danger">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
