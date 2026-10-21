"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Archive, ArchiveRestore, ArrowLeftRight, BarChart3, Plug, CalendarRange, ChevronsUpDown, GanttChartSquare, Keyboard, ListChecks, History, KanbanSquare, ListTree, LogOut, Pencil, Shapes, Users, X } from "lucide-react";

import { UserMenu } from "@/components/UserMenu";
import { archiveProject, unarchiveProject, removeMember, renameProject } from "@/lib/actions";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { ROLE_LABEL } from "@/lib/roles";
import { PresencePanel } from "./realtime/PresencePanel";
import { useProject } from "./ProjectContext";

interface SidebarProps {
  readonly project: { readonly id: string; readonly name: string };
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

export function Sidebar({ project, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { isArchived, isOwner, role, currentUserId } = useProject();
  const base = `/project/${project.id}`;

  const workItems = [
    { name: "Board", href: `${base}/board`, icon: KanbanSquare },
    { name: "Backlog", href: `${base}/backlog`, icon: ListTree },
    { name: "Timeline", href: `${base}/timeline`, icon: GanttChartSquare },
    { name: "Sprints", href: `${base}/sprints`, icon: CalendarRange },
    { name: "Planning", href: `${base}/planning`, icon: ListChecks },
    { name: "Reports", href: `${base}/reports`, icon: BarChart3 },
  ];
  const settingsItems = [
    { name: "Members", href: `${base}/settings/members`, icon: Users },
    { name: "Item types", href: `${base}/settings/nodes`, icon: Shapes },
    { name: "Import & export", href: `${base}/settings/data`, icon: ArrowLeftRight },
    { name: "Integrations", href: `${base}/settings/integrations`, icon: Plug },
    { name: "History", href: `${base}/history`, icon: History },
  ];

  return (
    <aside
      className={[
        "sidebar-planner z-[100] flex h-screen w-[var(--sidebar-width)] flex-col border-r border-border bg-sidebar",
        "max-lg:fixed max-lg:left-0 max-lg:top-0 max-lg:-translate-x-full max-lg:transition-transform max-lg:duration-200",
        isOpen ? "max-lg:translate-x-0 max-lg:shadow-lg" : "",
      ].join(" ")}
    >
      <div className="flex items-center gap-1 p-3 pb-2">
        <ProjectSwitcher project={project} isArchived={isArchived} isOwner={isOwner} roleLabel={isOwner ? null : ROLE_LABEL[role]} currentUserId={currentUserId} />
        <button onClick={onClose} className="icon-button lg:hidden" aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 py-2" aria-label="Project">
        {workItems.map((item) => (
          <NavLink key={item.name} {...item} active={pathname === item.href} onNavigate={onClose} />
        ))}

        <p className="mb-1 mt-5 px-2.5 text-xs font-medium text-faint">Settings</p>
        {settingsItems.map((item) => (
          <NavLink key={item.name} {...item} active={pathname.startsWith(item.href)} onNavigate={onClose} />
        ))}
      </nav>

      <div className="border-t border-border pt-2">
        <PresencePanel />
      </div>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event("qp:help"))}
          className="mb-1 flex h-7 w-full items-center gap-2 rounded-md px-2.5 text-xs text-faint transition-colors hover:bg-hover hover:text-fg"
        >
          <Keyboard size={13} /> Keyboard shortcuts <kbd className="ml-auto rounded border border-border-strong px-1 font-mono text-[10px]">?</kbd>
        </button>
        <UserMenu />
      </div>
    </aside>
  );
}

function NavLink({ name, href, icon: Icon, active, onNavigate }: Readonly<{
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  active: boolean;
  onNavigate?: () => void;
}>) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={[
        "flex h-8 items-center gap-2.5 rounded-md px-2.5 text-sm no-underline transition-colors",
        active ? "bg-active font-medium text-fg" : "text-muted hover:bg-hover hover:text-fg",
      ].join(" ")}
    >
      <Icon size={16} strokeWidth={active ? 2.25 : 1.75} />
      {name}
    </Link>
  );
}

function ProjectSwitcher({ project, isArchived, isOwner, roleLabel, currentUserId }: Readonly<{
  project: { id: string; name: string };
  isArchived: boolean;
  isOwner: boolean;
  roleLabel: string | null;
  currentUserId: string;
}>) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(project.name);
  const [renameError, setRenameError] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleArchive = async () => {
    setBusy(true);
    try {
      if (isArchived) {
        await unarchiveProject(project.id);
        router.refresh();
      } else {
        await archiveProject(project.id);
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to archive/unarchive project:", error);
    } finally {
      setBusy(false);
      setOpen(false);
    }
  };

  const leave = async () => {
    if (!confirm(`Leave “${project.name}”? You'll lose access until someone invites you again.`)) return;
    setBusy(true);
    const result = await removeMember(project.id, currentUserId);
    setBusy(false);
    if (result.error) alert(result.error);
    else router.push("/projects");
  };

  const saveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setRenameError("");
    const result = await renameProject(project.id, name);
    setBusy(false);
    if (result.error) {
      setRenameError(result.error);
      return;
    }
    setRenaming(false);
    router.refresh();
  };

  return (
    <div ref={ref} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-md p-1.5 text-left transition-colors hover:bg-hover"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-fg">
          {project.name.trim().charAt(0).toUpperCase() || "P"}
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-sm font-semibold text-fg">{project.name}</span>
          {isArchived ? (
            <span className="block text-xs text-danger">Archived · read-only</span>
          ) : roleLabel ? (
            <span className="block text-xs text-faint">{roleLabel}</span>
          ) : null}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-faint" />
      </button>

      {open && (
        <div role="menu" className="absolute left-0 right-0 top-full z-50 mt-1 animate-pop-in rounded-lg border border-border bg-panel p-1 shadow-lg">
          <Link href="/projects" role="menuitem" className="flex h-8 items-center rounded-md px-2.5 text-sm text-fg no-underline hover:bg-hover" onClick={() => setOpen(false)}>
            All projects
          </Link>
          <div className="my-1 h-px bg-border" />
          {isOwner ? (
            <>
              <button role="menuitem" onClick={() => { setName(project.name); setRenameError(""); setRenaming(true); setOpen(false); }} className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-hover">
                <Pencil size={14} /> Rename project
              </button>
              <button
                role="menuitem"
                onClick={toggleArchive}
                disabled={busy}
                className={`flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm hover:bg-hover disabled:opacity-50 ${isArchived ? "text-fg" : "text-danger"}`}
              >
                {isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
                {isArchived ? "Restore project" : "Archive project"}
              </button>
            </>
          ) : (
            <button role="menuitem" onClick={leave} disabled={busy} className="flex h-8 w-full items-center gap-2 rounded-md px-2.5 text-left text-sm text-danger hover:bg-hover disabled:opacity-50">
              <LogOut size={14} /> Leave project
            </button>
          )}
        </div>
      )}

      <Modal
        isOpen={renaming}
        onClose={() => setRenaming(false)}
        title="Rename project"
        maxWidth="420px"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRenaming(false)}>Cancel</Button>
            <Button type="submit" form="rename-project-form" loading={busy}>Save</Button>
          </div>
        }
      >
        <form id="rename-project-form" onSubmit={saveName} className="pt-2">
          <label htmlFor="project-name" className="sr-only">Project name</label>
          <input id="project-name" autoFocus className="input-planner" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          {renameError && <p className="mt-2 text-sm text-danger" role="alert">{renameError}</p>}
        </form>
      </Modal>
    </div>
  );
}
