"use client";

import { Menu, ShieldAlert } from "lucide-react";
import { useProject } from "./ProjectContext";

interface TopAppBarProps {
  readonly projectId: string;
  readonly onMenuClick?: () => void;
}

/** Mobile menu button and the read-only notice. Desktop navigation lives in the sidebar. */
export function TopAppBar({ onMenuClick }: Readonly<TopAppBarProps>) {
  const { project, isReadOnly, isArchived } = useProject();

  return (
    <>
      <header className="sticky top-0 z-40 flex h-12 items-center gap-2 border-b border-border bg-bg px-3 lg:hidden">
        <button onClick={onMenuClick} className="icon-button" aria-label="Open menu">
          <Menu size={18} />
        </button>
        <span className="truncate text-sm font-semibold">{project.name}</span>
      </header>

      {isReadOnly && (
        <div role="status" className="flex items-center gap-2 border-b border-border bg-danger-soft px-6 py-2 text-sm text-danger">
          <ShieldAlert size={14} />
          {isArchived
            ? "This project is archived and read-only. The owner can restore it from the project menu."
            : "You have view-only access to this project. You can still read everything and leave comments."}
        </div>
      )}
    </>
  );
}
