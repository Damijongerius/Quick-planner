"use client";

import React, { useState } from 'react';
import { Plus, Sparkles } from "lucide-react";
import { createNode } from "@/lib/actions";

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
    <div className="backlog-tree-actions" style={{ '--depth-padding': `${depth * 40 + 80}px`, backgroundColor: 'transparent', border: 'none' } as any}>
      {!isCreating ? (
        <div className="flex gap-md">
          <button onClick={onOpenAI} className="button-sanctuary px-lg py-xs text-10px rounded-full border-dashed" style={{ padding: '6px 16px' }}><Sparkles size={12} className="text-primary" />AI Generate</button>
          <button onClick={() => setIsCreating(true)} className="button-secondary px-lg py-xs text-10px rounded-full" style={{ padding: '6px 16px' }}><Plus size={12} />Add Child</button>
        </div>
      ) : (
        <form onSubmit={handleCreate} className="child-creation-form" style={{ padding: '24px', borderRadius: '24px', boxShadow: 'var(--ambient-shadow)' }}>
          <div className="text-meta text-[9px] mb-sm opacity-60">SELECT OBJECTIVE TYPE</div>
          <div className="flex flex-wrap gap-xs mb-lg">
            {allowedChildren.map((type: any) => (
              <button key={type.id} type="button" onClick={() => setSelectedType(type)} className={`type-chip ${selectedType?.id === type.id ? 'active' : ''}`} style={{ '--type-color': type.color } as any}>{type.name.toUpperCase()}</button>
            ))}
          </div>
          <div className="flex gap-md">
            <input autoFocus className="input-sanctuary flex-1 h-11 text-sm" placeholder="Enter strategic title..." value={newNodeTitle} onChange={(e) => setNewNodeTitle(e.target.value)} />
            <button type="submit" className="button-premium px-xl" disabled={!newNodeTitle || !selectedType}>Initialize</button>
            <button type="button" className="button-ghost" onClick={() => setIsCreating(false)}>Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
