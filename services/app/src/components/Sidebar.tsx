"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  KanbanSquare, 
  ChevronLeft,
  X
} from "lucide-react";

import { UserMenu } from "@/components/UserMenu";
import { useProject } from "./ProjectContext";
import "./Sidebar.css";

interface SidebarProps {
  readonly project: {
    readonly id: string;
    readonly name: string;
  };
  readonly isOpen?: boolean;
  readonly onClose?: () => void;
}

export function Sidebar({ project, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const { isReadOnly } = useProject();
  const menuItems = [
    { name: "Sprint Board", href: `/project/${project.id}/board`, icon: KanbanSquare },
    { name: "Hierarchical Backlog", href: `/project/${project.id}/backlog`, icon: LayoutDashboard },
  ];

  return (
    <aside className={`sidebar-planner ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="flex justify-between items-center mb-md lg:hidden">
          <span className="text-meta">MENU</span>
          <button onClick={onClose} className="p-sm hover:bg-surface-container-high rounded-full">
            <X size={20} />
          </button>
        </div>

        <Link 
            href="/projects" 
            className="sidebar-back-link"
        >
          <ChevronLeft size={16} /> Back to Projects
        </Link>
        
        <h1 className="sidebar-project-name">
            {project.name}
        </h1>
        <p className={`text-meta sidebar-workspace-label ${isReadOnly ? 'text-error font-bold' : ''}`}>
          {isReadOnly ? 'DECOMMISSIONED' : 'Active Workspace'}
        </p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.name} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <UserMenu />
        <div className="sidebar-version-info">
            <span>VERSION 0.2.1</span>
            <span>STABLE</span>
        </div>
      </div>
    </aside>
  );
}
