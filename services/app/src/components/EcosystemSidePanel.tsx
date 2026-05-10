"use client";

import React from 'react';
import { X, Braces, LayoutGrid, Trash2 } from 'lucide-react';
import { IconRenderer, IconPicker } from './IconPicker';
import { SanctuaryColorPicker } from './SanctuaryColorPicker';
import { Button } from './ui/Button';
import { updateNodeType, deleteNodeType } from '@/lib/actions';

interface EcosystemSidePanelProps {
  projectId: string;
  activeNodeType: any;
  onClose: () => void;
  onOpenFieldEditor: () => void;
  onOpenBoardEditor: () => void;
}

export function EcosystemSidePanel({ 
  projectId, 
  activeNodeType, 
  onClose,
  onOpenFieldEditor,
  onOpenBoardEditor
}: EcosystemSidePanelProps) {
  const [name, setName] = React.useState(activeNodeType.name);

  React.useEffect(() => {
    setName(activeNodeType.name);
  }, [activeNodeType]);
  
  const handleUpdateIcon = async (icon: string) => {
    await updateNodeType(projectId, activeNodeType.id, activeNodeType.name, activeNodeType.color, icon, activeNodeType.isSprintEligible);
  };

  const handleUpdateColor = async (color: string) => {
    await updateNodeType(projectId, activeNodeType.id, name, color, activeNodeType.icon, activeNodeType.isSprintEligible);
  };

  const handleUpdateName = async () => {
    if (name === activeNodeType.name) return;
    await updateNodeType(projectId, activeNodeType.id, name, activeNodeType.color, activeNodeType.icon, activeNodeType.isSprintEligible);
  };

  const handleDelete = async () => {
    if(confirm(`Are you sure you want to delete the ${activeNodeType.name} blueprint? This cannot be undone.`)) {
        await deleteNodeType(projectId, activeNodeType.id);
        onClose();
    }
  };

  return (
    <div className="absolute right-md top-md bottom-md w-96 glass-dark p-xl z-50 flex flex-col gap-xl overflow-y-auto animate-in slide-in-from-right shadow-sanctuary rounded-2xl border border-outline-variant">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-container-high shadow-sm" style={{ color: activeNodeType.color }}>
                <IconRenderer name={activeNodeType.icon} size={28} />
            </div>
            <div className="flex-1">
                <input 
                    className="text-editorial font-bold text-xl bg-transparent border-none p-0 w-full focus:outline-none focus:ring-0" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    onBlur={handleUpdateName}
                />
                <p className="text-meta text-10px tracking-widest opacity-60">BLUEPRINT CONFIGURATION</p>
            </div>
        </div>
        <button onClick={onClose} className="p-sm hover:bg-surface-container-high rounded-full transition-colors">
            <X size={18} />
        </button>
      </div>

      <div className="space-y-xl">
        <section>
            <label className="text-meta text-10px mb-md block opacity-60">VISUAL IDENTITY</label>
            <div className="flex flex-col gap-lg">
                <div>
                    <p className="text-10px font-bold mb-sm opacity-40 uppercase">Icon</p>
                    <IconPicker currentIcon={activeNodeType.icon} onSelect={handleUpdateIcon} color={activeNodeType.color} />
                </div>
                <div>
                    <p className="text-10px font-bold mb-sm opacity-40 uppercase">Color Palette</p>
                    <SanctuaryColorPicker currentColor={activeNodeType.color} onSelect={handleUpdateColor} />
                </div>
            </div>
        </section>

        <section>
            <label className="text-meta text-10px mb-md block opacity-60">ARCHITECTURE</label>
            <div className="flex flex-col gap-sm">
                <Button onClick={onOpenFieldEditor} variant="sanctuary" size="sm" icon={<Braces size={16} />} className="w-full justify-start h-12 px-lg">
                    Edit Fields Definitions
                </Button>
                <Button onClick={onOpenBoardEditor} variant="secondary" size="sm" icon={<LayoutGrid size={16} />} className="w-full justify-start h-12 px-lg">
                    Board Governance
                </Button>
            </div>
        </section>

        <section>
            <label className="text-meta text-10px mb-md block opacity-60">DEFINED FIELDS</label>
            <div className="flex flex-wrap gap-xs">
                {activeNodeType.fields?.map((f: any) => (
                    <span key={f.id} className="px-sm py-xs bg-surface-container-high rounded-lg text-10px font-bold text-on-surface-variant border border-outline-variant">
                        {f.name.toUpperCase()}
                    </span>
                ))}
                {activeNodeType.fields?.length === 0 && <p className="text-10px italic opacity-40">No custom fields defined</p>}
            </div>
        </section>
      </div>

      <div className="mt-auto pt-xl border-t border-outline-variant">
        <Button onClick={handleDelete} variant="ghost" size="sm" className="text-error w-full justify-start hover:bg-error/10" icon={<Trash2 size={16} />}>
            Destroy Blueprint
        </Button>
      </div>
    </div>
  );
}
