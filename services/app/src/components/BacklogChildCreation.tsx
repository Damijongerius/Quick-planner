import React, { useState } from 'react';
import { Plus, Sparkles, X, Terminal } from "lucide-react";
import { createNode } from "@/lib/actions";
import { Button } from "./ui/Button";

import { Node, NodeType } from "@/lib/types";

interface BacklogChildCreationProps {
  projectId: string;
  node: Node;
  allowedChildren: NodeType[];
  depth: number;
  onChildCreated: () => void;
}

export function BacklogChildCreation({ projectId, node, allowedChildren, depth, onChildCreated }: Readonly<BacklogChildCreationProps>) {
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType | null>(null);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;
    await createNode(projectId, node.id, selectedType.id, newNodeTitle);
    setIsCreating(false); setNewNodeTitle(""); setSelectedType(null);
    onChildCreated();
  };

  return (
    <div className="backlog-creation-container" style={{ '--depth-padding': `${depth * 40 + 80}px` } as React.CSSProperties}>
      {isCreating ? (
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
                {allowedChildren.map((type) => (
                  <button 
                    key={type.id} 
                    type="button" 
                    onClick={() => setSelectedType(type)} 
                    className={`blueprint-chip ${selectedType?.id === type.id ? 'active' : ''}`} 
                    style={{ '--type-color': type.color || 'var(--primary)' } as React.CSSProperties}
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
      ) : (
        <div className="flex gap-md items-center py-sm">
          <div className="backlog-tree-line-subtle" />

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
      )}
    </div>
  );
}
