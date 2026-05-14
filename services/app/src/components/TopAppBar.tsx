"use client";
import "./TopAppBar.css";
import "./ui/Button.css";

import { useState, useRef, useEffect } from "react";
import { Search, Bell, Settings, Calendar, Trees, LayoutGrid, ChevronRight, X, Clock, Menu } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { archiveProject } from "@/lib/actions";

interface TopAppBarProps {
  projectId: string;
  onMenuClick?: () => void;
}

export function TopAppBar({ projectId, onMenuClick }: TopAppBarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      await archiveProject(projectId);
      router.push("/projects");
    } catch (error) {
      console.error("Failed to archive project:", error);
      setIsArchiving(false);
    }
  };

  const settingsItems = [
    { name: "Sprints", href: `/project/${projectId}/sprints`, icon: Calendar, desc: "Manage milestones and dates" },
    { name: "Audit Log", href: `/project/${projectId}/history`, icon: Clock, desc: "Track all strategic changes" },
    { name: "Node Architecture", href: `/project/${projectId}/settings/nodes`, icon: Trees, desc: "Design types and connections" },
  ];

  return (
    <header className="top-bar">
      <div className="flex items-center lg:hidden">
        <button 
          onClick={onMenuClick}
          className="icon-button"
        >
          <Menu size={20} className="text-on-surface" />
        </button>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-sm shrink-0" ref={dropdownRef}>
        <div className="relative">
          <button className="icon-button">
            <Bell size={20} className="text-on-surface-variant" />
          </button>
        </div>
        
        <div className="relative">
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
                style={{ right: 0, top: '100%', marginTop: '12px' }}
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
                
                <div className="dropdown-footer" style={{ borderTop: '1px solid var(--outline-variant)', marginTop: '8px', paddingTop: '8px' }}>
                    <button 
                      className="button-ghost w-full justify-center text-error font-bold"
                      style={{ border: 'none', background: 'transparent' }}
                      onClick={handleArchive}
                      disabled={isArchiving}
                    >
                        {isArchiving ? "Archiving..." : "Archive Project"}
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
