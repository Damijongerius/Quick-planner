"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, Settings, Calendar, Trees, LayoutGrid, ChevronRight, X, Clock } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface TopAppBarProps {
  projectId: string;
}

export function TopAppBar({ projectId }: TopAppBarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Corrected click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const settingsItems = [
    { name: "Sprints", href: `/project/${projectId}/sprints`, icon: Calendar, desc: "Manage milestones and dates" },
    { name: "Audit Log", href: `/project/${projectId}/history`, icon: Clock, desc: "Track all strategic changes" },
    { name: "Node Relations", href: `/project/${projectId}/settings/relations`, icon: Trees, desc: "Define connection rules" },
    { name: "Nodes", href: `/project/${projectId}/settings/nodes`, icon: LayoutGrid, desc: "Configure types and fields" },
  ];

  return (
    <header className="top-bar">
      <div className="flex items-center gap-md">
        <div className="flex gap-xs relative" ref={dropdownRef}>
          <button className="icon-button">
            <Bell size={20} className="text-on-surface-variant" />
          </button>
          
          <button 
            className={`icon-button ${isSettingsOpen ? 'active' : ''}`}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          >
            <Settings size={20} className={isSettingsOpen ? 'text-primary' : 'text-on-surface-variant'} />
          </button>

          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="glass dropdown-menu settings-dropdown"
              >
                <div className="dropdown-header">
                    <p className="text-meta">Workspace Settings</p>
                </div>
                
                <div className="dropdown-body flex flex-col gap-xs">
                    {settingsItems.map((item) => (
                        <Link 
                            key={item.name} 
                            href={item.href}
                            onClick={() => setIsSettingsOpen(false)}
                            className="nav-link"
                        >
                            <div className="nav-item flex items-center gap-md">
                                <div className="text-primary">
                                    <item.icon size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="dropdown-item-title">{item.name}</p>
                                    <p className="dropdown-item-desc">{item.desc}</p>
                                </div>
                                <ChevronRight size={14} className="text-meta opacity-30" />
                            </div>
                        </Link>
                    ))}
                </div>
                
                <div className="dropdown-footer">
                    <button className="button-ghost w-full justify-center text-error text-xs">
                        Archive Project
                    </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
