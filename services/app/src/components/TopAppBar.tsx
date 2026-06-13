"use client";
import "./TopAppBar.css";
import "./ui/Button.css";

import { useState, useRef, useEffect } from "react";
import { Bell, Settings, Calendar, Trees, ChevronRight, Clock, Menu, ShieldAlert, Cpu } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { archiveProject, unarchiveProject } from "@/lib/actions";
import { useProject } from "./ProjectContext";
import { GeneralSettingsModal } from "./settings/GeneralSettingsModal";

interface TopAppBarProps {
  readonly projectId: string;
  readonly onMenuClick?: () => void;
}

export function TopAppBar({ projectId, onMenuClick }: Readonly<TopAppBarProps>) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGeneralSettingsOpen, setIsGeneralSettingsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { isReadOnly } = useProject();

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
      if (isReadOnly) {
        await unarchiveProject(projectId);
        router.refresh();
      } else {
        await archiveProject(projectId);
        router.push("/projects");
      }
    } catch (error) {
      console.error("Failed to archive/unarchive project:", error);
    } finally {
      setIsArchiving(false);
      setIsSettingsOpen(false);
    }
  };

  let archiveActionLabel = isReadOnly ? "Restore Project" : "Archive Project";
  if (isArchiving) {
    archiveActionLabel = "Processing...";
  }

  const settingsItems = [
    { name: "Sprints", href: `/project/sprints?projectId=${projectId}`, icon: Calendar, desc: "Manage milestones and dates" },
    { name: "Audit Log", href: `/project/history?projectId=${projectId}`, icon: Clock, desc: "Track all strategic changes" },
    { name: "Node Blueprints", href: `/project/settings/nodes?projectId=${projectId}`, icon: Trees, desc: "Design types and connections" },
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

      <div className="flex-1 flex items-center gap-md">
        {isReadOnly && (
          <div className="flex items-center gap-xs px-md py-xs bg-error/10 border border-error/20 rounded-full text-error font-bold text-[10px] tracking-widest uppercase">
            <ShieldAlert size={12} /> Read-Only Workspace
          </div>
        )}
      </div>

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

                <div className="dropdown-header" style={{ borderTop: '1px solid var(--outline-variant)', marginTop: '8px', paddingTop: '8px' }}>
                  <p className="text-meta">General Settings</p>
                </div>

                <div className="dropdown-body flex flex-col gap-xs">
                  <button
                    onClick={() => {
                      setIsSettingsOpen(false);
                      setIsGeneralSettingsOpen(true);
                    }}
                    className="nav-link w-full text-left bg-transparent border-none p-0 cursor-pointer"
                    style={{ fontFamily: 'inherit' }}
                    type="button"
                  >
                    <div className="nav-item flex items-center gap-md">
                      <div className="text-primary">
                        <Cpu size={18} />
                      </div>
                      <div className="flex-1">
                        <p className="dropdown-item-title">Ollama AI Configuration</p>
                        <p className="dropdown-item-desc">Configure local model settings</p>
                      </div>
                      <ChevronRight size={14} className="text-meta opacity-30" />
                    </div>
                  </button>
                </div>

                <div className="dropdown-footer" style={{ borderTop: '1px solid var(--outline-variant)', marginTop: '8px', paddingTop: '8px' }}>
                  <button
                    className={`button-ghost w-full justify-center font-bold ${isReadOnly ? 'text-primary' : 'text-error'}`}
                    style={{ border: 'none', background: 'transparent' }}
                    onClick={handleArchive}
                    disabled={isArchiving}
                  >
                    {archiveActionLabel}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <GeneralSettingsModal
        isOpen={isGeneralSettingsOpen}
        onClose={() => setIsGeneralSettingsOpen(false)}
      />
    </header>
  );
}
