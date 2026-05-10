"use client";

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { createNodeType } from '@/lib/actions';
import { IconPicker } from './IconPicker';
import { SanctuaryColorPicker } from './SanctuaryColorPicker';

interface EcosystemCreationOverlayProps {
  projectId: string;
  onClose: () => void;
}

export function EcosystemCreationOverlay({ projectId, onClose }: EcosystemCreationOverlayProps) {
  const [newName, setNewName] = useState("");
  const [color, setColor] = useState("#4656b8");
  const [icon, setIcon] = useState("Target");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newName);
    formData.append("color", color);
    formData.append("icon", icon);
    await createNodeType(projectId, formData);
    setNewName("");
    onClose();
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-surface/80 backdrop-blur-md animate-in fade-in">
       <div className="card-sanctuary p-2xl w-full max-w-md shadow-sanctuary">
          <h3 className="text-editorial text-2xl font-bold mb-md">New Node Type</h3>
          <p className="text-secondary mb-xl">Define a new building block for your strategic ecosystem.</p>
          
          <form onSubmit={handleCreate} className="flex flex-col gap-xl">
            <div>
                <label className="text-meta block text-xs mb-sm">TYPE NAME</label>
                <input 
                    autoFocus
                    className="input-sanctuary"
                    placeholder="e.g. Objective, Goal, Task..."
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                />
            </div>

            <div className="flex flex-col gap-lg">
                <div>
                    <label className="text-meta block text-xs mb-sm">VISUAL IDENTITY</label>
                    <div className="flex flex-col gap-md">
                        <p className="text-10px font-bold opacity-40 uppercase">Icon</p>
                        <IconPicker currentIcon={icon} onSelect={setIcon} color={color} />
                    </div>
                </div>
                <div>
                    <p className="text-10px font-bold mb-sm opacity-40 uppercase">Color Palette</p>
                    <SanctuaryColorPicker currentColor={color} onSelect={setColor} />
                </div>
            </div>
            
            <div className="flex gap-md">
                <Button type="submit" className="flex-1">Initialize Type</Button>
                <Button variant="ghost" onClick={onClose}>Cancel</Button>
            </div>
          </form>
       </div>
    </div>
  );
}
