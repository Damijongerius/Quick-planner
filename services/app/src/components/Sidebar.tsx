"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Settings, User, Trees, KanbanSquare, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const menuItems = [
  { name: "Backlog", href: "/backlog", icon: LayoutDashboard },
  { name: "Sprint Board", href: "/board", icon: KanbanSquare },
  { name: "Sprints", href: "/sprints", icon: Calendar },
  { name: "Relation Tree", href: "/settings/relations", icon: Trees },
  { name: "Node Types", href: "/settings/nodes", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar glass" style={{ width: '260px', height: '100vh', position: 'fixed', top: 0, left: 0, padding: '24px', borderRadius: '0 24px 24px 0' }}>
      <div className="flex items-center gap-2 mb-10" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', background: 'linear-gradient(to right, #3b82f6, #9333ea)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Quick Planner
        </h1>
      </div>
      
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                  color: isActive ? '#3b82f6' : '#9ca3af',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={20} />
                <span style={{ fontWeight: 500 }}>{item.name}</span>
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
