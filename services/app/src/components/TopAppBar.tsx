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
    { name: "Strategic Cycles", href: `/project/${projectId}/sprints`, icon: Calendar, desc: "Manage milestones and dates" },
    { name: "Audit Log", href: `/project/${projectId}/history`, icon: Clock, desc: "Track all strategic changes" },
    { name: "Relation Map", href: `/project/${projectId}/settings/relations`, icon: Trees, desc: "Define connection rules" },
    { name: "Node Governance", href: `/project/${projectId}/settings/nodes`, icon: LayoutGrid, desc: "Configure types and fields" },
  ];

  return (
    <header className="top-bar">
      <div className="search-container" style={{ width: '33%' }}>
        <Search className="search-icon" size={18} />
        <input 
          className="input-premium" 
          placeholder="Find nodes in this workspace..." 
          type="text" 
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '4px', position: 'relative' }} ref={dropdownRef}>
          <button className="button-secondary" style={{ border: 'none', padding: '8px' }}>
            <Bell size={20} className="text-meta" style={{ color: 'var(--on-surface-variant)' }} />
          </button>
          
          <button 
            className={`button-secondary ${isSettingsOpen ? 'active' : ''}`}
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            style={{ 
                border: 'none', 
                padding: '8px',
                backgroundColor: isSettingsOpen ? 'var(--surface-container-high)' : 'transparent'
            }}
          >
            <Settings size={20} className="text-meta" style={{ color: isSettingsOpen ? 'var(--primary)' : 'var(--on-surface-variant)' }} />
          </button>

          <AnimatePresence>
            {isSettingsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="glass"
                style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    right: 0, 
                    marginTop: '12px', 
                    width: '320px', 
                    padding: '12px',
                    zIndex: 100,
                    borderRadius: '24px'
                }}
              >
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--outline-variant)', marginBottom: '8px' }}>
                    <p className="text-meta">Workspace Settings</p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {settingsItems.map((item) => (
                        <Link 
                            key={item.name} 
                            href={item.href}
                            onClick={() => setIsSettingsOpen(false)}
                            style={{ textDecoration: 'none' }}
                        >
                            <div className="nav-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px' }}>
                                <div style={{ color: 'var(--primary)' }}>
                                    <item.icon size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-surface)' }}>{item.name}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', opacity: 0.7 }}>{item.desc}</p>
                                </div>
                                <ChevronRight size={14} className="text-meta" style={{ opacity: 0.3 }} />
                            </div>
                        </Link>
                    ))}
                </div>
                
                <div style={{ padding: '12px', marginTop: '8px', borderTop: '1px solid var(--outline-variant)' }}>
                    <button className="button-secondary" style={{ width: '100%', border: 'none', justifyContent: 'center', color: 'var(--error)', fontSize: '12px' }}>
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
