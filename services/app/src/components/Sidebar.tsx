"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  User, 
  KanbanSquare, 
  ChevronLeft,
} from "lucide-react";
import { motion } from "framer-motion";

import { UserMenu } from "@/components/UserMenu";

interface SidebarProps {
  project: {
    id: string;
    name: string;
  };
}

export function Sidebar({ project }: SidebarProps) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Sprint Board", href: `/project/${project.id}/board`, icon: KanbanSquare },
    { name: "Hierarchical Backlog", href: `/project/${project.id}/backlog`, icon: LayoutDashboard },
  ];

  return (
    <aside className="sidebar-sanctuary">
      <div className="sidebar-header">
        <Link 
            href="/projects" 
            className="sidebar-back-link"
        >
          <ChevronLeft size={16} /> Back to Projects
        </Link>
        
        <h1 className="sidebar-project-name">
            {project.name}
        </h1>
        <p className="text-meta sidebar-workspace-label">Active Workspace</p>
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
