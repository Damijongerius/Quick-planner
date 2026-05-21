"use client";

import React, { useState } from 'react';
import { Plus, X } from "lucide-react";
import { createNode } from "@/lib/actions";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { Node, NodeType } from "@/lib/types";

interface BacklogChildCreationProps {
  projectId: string;
  node: Node;
  allowedChildren: NodeType[];
  depth: number;
  onChildCreated: (newNode: Node) => void;
}

export function BacklogChildCreation({ 
  projectId, 
  node, 
  allowedChildren, 
  depth, 
  onChildCreated 
}: Readonly<BacklogChildCreationProps>) {
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType | null>(null);

  const handleStartCreating = () => {
    setIsCreating(true);
    if (allowedChildren.length === 1) {
      setSelectedType(allowedChildren[0]);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;
    const newNode = await createNode(projectId, node.id, selectedType.id, newNodeTitle, {}, node.sprintId);
    setIsCreating(false); 
    setNewNodeTitle(""); 
    setSelectedType(null);
    onChildCreated(newNode as unknown as Node);
  };

  const allowedOptions = allowedChildren.map(t => ({ value: t.id, label: t.name, color: t.color || undefined }));

  if (isCreating) {
    return (
      <div 
        className="backlog-row-container inline-creation-row border-b border-outline-variant" 
        style={{ 
          '--depth-padding': `${depth * 28 + 52}px`,
          paddingLeft: 'var(--depth-padding)',
          paddingRight: '24px'
        } as React.CSSProperties}
      >
        <form onSubmit={handleCreate} className="flex items-center gap-md w-full py-xs">
          <div style={{ minWidth: '100px' }}>
            <Select 
              options={allowedOptions}
              value={selectedType?.id || ""}
              onChange={(val) => setSelectedType(allowedChildren.find(t => t.id === val) || null)}
              placeholder="Type..."
              triggerClassName="inline-type-select text-xs font-semibold py-xs px-sm"
            />
          </div>
          
          <Input 
            autoFocus 
            className="inline-title-input flex-1 py-xs px-sm text-sm" 
            placeholder="New branch title..." 
            value={newNodeTitle} 
            onChange={(e) => setNewNodeTitle(e.target.value)} 
            required
          />
          
          <div className="flex gap-sm items-center">
            <Button type="submit" size="sm">Add</Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={() => setIsCreating(false)} 
              className="!p-0 w-8 h-8 min-w-[32px] min-h-[32px] rounded-full flex items-center justify-center shrink-0"
            >
              <X size={18} />
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div 
      className="flex gap-md items-center py-xs" 
      style={{ 
        paddingLeft: `${depth * 28 + 52}px`
      }}
    >
      <Button 
        onClick={handleStartCreating} 
        variant="secondary" 
        size="sm" 
        className="rounded-full"
        icon={<Plus size={14} />}
      >
        ADD BRANCH
      </Button>
    </div>
  );
}
