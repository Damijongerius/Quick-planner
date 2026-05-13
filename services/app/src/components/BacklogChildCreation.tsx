"use client";

import React, { useState } from 'react';
import { Plus, Sparkles, X, Terminal } from "lucide-react";
import { createNode } from "@/lib/actions";
import { Button } from "./ui/Button";

export function BacklogChildCreation({ projectId, node, allowedChildren, depth, onChildCreated, onOpenAI }: any) {
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<any>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;
    await createNode(projectId, node.id, selectedType.id, newNodeTitle);
    setIsCreating(false); setNewNodeTitle(""); setSelectedType(null);
    onChildCreated();
  };

  return (
    <div className="backlog-creation-container" style={{ '--depth-padding': `${depth * 40 + 80}px` } as any}>
      {!isCreating ? (
        <div className="flex gap-md items-center py-sm">
          <div className="backlog-tree-line-subtle" />
          <Button 
            onClick={onOpenAI} 
            variant="secondary" 
            size="sm" 
            className="rounded-full border-dashed"
            icon={<Sparkles size={12} className="text-primary" />}
          >
            AI ARCHITECT
          </Button>
          <Button 
            onClick={() => setIsCreating(true)} 
            variant="secondary" 
            size="sm" 
            className="rounded-full"
            icon={<Plus size={14} />}
          >
            ADD BRANCH
          </Button>
        </div>
      ) : (
        <div className="child-creation-suite glass animate-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-lg">
             <div className="flex items-center gap-sm">
                <Terminal size={14} className="opacity-40" />
                <span className="text-meta text-[10px]">Initialize New Strategic Branch</span>
             </div>
             <button onClick={() => setIsCreating(false)} className="opacity-40 hover:opacity-100 transition-opacity">
                <X size={16} />
             </button>
          </div>

          <form onSubmit={handleCreate} className="flex flex-col gap-xl">
            <div>
              <div className="text-[10px] font-black opacity-30 mb-md tracking-widest uppercase">Select Objective Blueprint</div>
              <div className="flex flex-wrap gap-sm">
                {allowedChildren.map((type: any) => (
                  <button 
                    key={type.id} 
                    type="button" 
                    onClick={() => setSelectedType(type)} 
                    className={`blueprint-chip ${selectedType?.id === type.id ? 'active' : ''}`} 
                    style={{ '--type-color': type.color } as any}
                  >
                    <div className="blueprint-chip-dot" />
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-md items-end">
              <div className="flex-1">
                 <div className="text-[10px] font-black opacity-30 mb-sm tracking-widest uppercase">Objective Title</div>
                 <input 
                    autoFocus 
                    className="input-planner w-full h-12" 
                    placeholder="Enter strategic title..." 
                    value={newNodeTitle} 
                    onChange={(e) => setNewNodeTitle(e.target.value)} 
                 />
              </div>
              <Button 
                type="submit" 
                disabled={!newNodeTitle || !selectedType}
                className="h-12 px-xl"
              >
                INITIALIZE
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
