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
      <div style={{ marginBottom: '32px' }}>
        <Link 
            href="/projects" 
            className="button-secondary" 
            style={{ 
                border: 'none', 
                padding: '8px 0', 
                marginBottom: '24px', 
                fontSize: '11px', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.1em',
                color: 'var(--on-surface-variant)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'transparent'
            }}
        >
          <ChevronLeft size={16} /> Back to Projects
        </Link>
        
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--on-surface)', lineHeight: 1.1 }}>
            {project.name}
        </h1>
        <p className="text-meta" style={{ marginTop: '4px', opacity: 0.6 }}>Active Workspace</p>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
        <Link href="/profile" className={`nav-item ${pathname === '/profile' ? 'active' : ''}`}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', overflow: 'hidden', backgroundColor: 'var(--surface-container-high)' }}>
            <User size={20} style={{ margin: '6px' }} />
          </div>
          <span>User Profile</span>
        </Link>
        <div style={{ 
            marginTop: '16px', 
            padding: '0 12px',
            fontSize: '9px', 
            fontWeight: 800, 
            color: 'var(--on-surface-variant)', 
            opacity: 0.4,
            letterSpacing: '0.05em',
            display: 'flex',
            justifyContent: 'space-between'
        }}>
            <span>VERSION 0.2.1</span>
            <span>STABLE</span>
        </div>
      </div>
    </aside>
  );
}
