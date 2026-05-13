"use client";
import "./BacklogToolbar.css";
import "./Backlog.css";
import "./TopAppBar.css";

import React from "react";
import { PlusCircle, Archive, ArchiveRestore, FileJson, Plus, Search, X } from "lucide-react";
import { Button } from "./ui/Button";
import { IconRenderer } from "./IconPicker";
import { AnimatePresence, motion } from "framer-motion";

interface BacklogToolbarProps {
  availableRootTypes: any[];
  onAddRoot: (typeId: string, typeName: string) => void;
  hideCompleted: boolean;
  onToggleHideCompleted: () => void;
  showArchived: boolean;
  onToggleShowArchived: () => void;
  onOpenAIBuilder: () => void;
}

export function BacklogToolbar({ 
  availableRootTypes, 
  onAddRoot, 
  hideCompleted, 
  onToggleHideCompleted, 
  showArchived, 
  onToggleShowArchived,
  onOpenAIBuilder 
}: BacklogToolbarProps) {
  const [showInitMenu, setShowInitMenu] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <div className="flex flex-col gap-md">
      <div className="flex justify-between items-center bg-surface-container-low p-md rounded-2xl border border-outline-variant shadow-sm backlog-toolbar-container">
        <div className="flex items-center gap-md relative">
          <button 
            onClick={() => availableRootTypes.length > 1 ? setShowInitMenu(!showInitMenu) : onAddRoot(availableRootTypes[0]?.id, availableRootTypes[0]?.name)}
            className="button-planner"
            style={{ padding: '12px 24px', fontSize: '13px', boxShadow: 'var(--primary-shadow)' }}
          >
            <Plus size={18} />
            {availableRootTypes.length === 1 ? `Initialize ${availableRootTypes[0]?.name}` : 'Initialize Objective'}
          </button>

          <button 
            className={`button-secondary rounded-full p-md ${showSearch ? 'active' : ''}`}
            onClick={() => setShowSearch(!showSearch)}
            style={{ width: '44px', height: '44px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {showSearch ? <X size={18} /> : <Search size={18} />}
          </button>

          <AnimatePresence>
            {showInitMenu && (
              <>
                <div className="context-menu-overlay" onClick={() => setShowInitMenu(false)} />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="glass dropdown-menu backlog-init-menu"
                  style={{ top: 'calc(100% + 12px)', left: 0, width: '280px', padding: '12px' }}
                >
                  <div className="dropdown-header" style={{ padding: '12px 8px' }}>
                    <div className="text-meta text-primary text-10px">SELECT STRATEGIC PILLAR</div>
                  </div>
                  <div className="dropdown-body flex flex-col gap-xs">
                    {availableRootTypes.map(type => (
                      <button
                        key={type.id}
                        onClick={() => { onAddRoot(type.id, type.name); setShowInitMenu(false); }}
                        className="button-ghost justify-start w-full gap-md hover:bg-surface-container-low"
                        style={{ '--node-color': type.color, padding: '12px 16px', borderRadius: '12px' } as any}
                      >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-container-high" style={{ color: 'var(--node-color)' }}>
                          <IconRenderer name={type.icon || 'Folder'} size={16} />
                        </div>
                        <span className="font-bold text-sm" style={{ color: 'var(--on-surface)' }}>{type.name}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex gap-md items-center backlog-toolbar-actions">
          <Button 
            variant={hideCompleted ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={onToggleHideCompleted}
            className={hideCompleted ? 'filter-active-tertiary' : ''}
          >
            {hideCompleted ? "SHOW COMPLETED" : "HIDE COMPLETED"}
          </Button>
          
          <Button 
            variant={showArchived ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={onToggleShowArchived}
            icon={showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
            className={showArchived ? 'filter-active-primary' : ''}
          >
            {showArchived ? "BACK TO ACTIVE" : "VIEW ARCHIVE"}
          </Button>

          <Button size="sm" onClick={onOpenAIBuilder} icon={<FileJson size={14} />}>
            AI BUILDER
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {showSearch && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <div className="bg-surface-container-low p-sm rounded-2xl border border-outline-variant shadow-sm flex items-center gap-md">
                <Search size={18} className="text-on-surface-variant ml-sm" />
                <input 
                  autoFocus
                  className="input-planner flex-1 border-none bg-transparent h-12 text-base" 
                  placeholder="Search objectives, tasks, and requirements..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
