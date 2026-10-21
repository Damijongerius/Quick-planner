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
  /** Open the inline form immediately (used by the row's "+" button). */
  startOpen?: boolean;
  onClose?: () => void;
}

export function BacklogChildCreation({ 
  projectId, 
  node, 
  allowedChildren, 
  depth, 
  onChildCreated,
  startOpen = false,
  onClose,
}: Readonly<BacklogChildCreationProps>) {
  const [isCreating, setIsCreating] = useState(startOpen);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType | null>(startOpen && allowedChildren.length === 1 ? allowedChildren[0] : null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStartCreating = () => {
    setIsCreating(true);
    if (allowedChildren.length === 1) {
      setSelectedType(allowedChildren[0]);
    }
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newNodeTitle.trim() || !selectedType || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const newNode = await createNode(projectId, node.id, selectedType.id, newNodeTitle, {}, node.sprintId);
      setIsCreating(false); 
      setNewNodeTitle(""); 
      setSelectedType(null);
      onClose?.();
      onChildCreated(newNode as unknown as Node);
    } catch (error) {
      console.error("Failed to create node", error);
      alert("Could not create that item. Check that this type is allowed under its parent.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const allowedOptions = allowedChildren.map(t => ({ value: t.id, label: t.name, color: t.color || undefined }));
  const indent = (depth + 1) * 20 + 12;

  if (isCreating) {
    return (
      <div className="border-b border-border bg-sidebar py-2 pr-3" style={{ paddingLeft: indent + 32 }}>
        <form onSubmit={handleCreate} className="flex items-center gap-2">
          {allowedChildren.length > 1 && (
            <div style={{ width: 130 }}>
              <Select
                options={allowedOptions}
                value={selectedType?.id || ""}
                onChange={(val) => setSelectedType(allowedChildren.find(t => t.id === val) || null)}
                placeholder="Type…"
              />
            </div>
          )}
          <Input
            autoFocus
            variant="planner"
            className="flex-1"
            placeholder={selectedType ? `New ${selectedType.name.toLowerCase()} title…` : "Title…"}
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setIsCreating(false); onClose?.(); } }}
            required
          />
          <Button type="submit" size="md" disabled={isSubmitting || !selectedType}>Add</Button>
          <Button type="button" variant="ghost" size="md" onClick={() => { setIsCreating(false); onClose?.(); }} aria-label="Cancel">
            <X size={16} />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="border-b border-border py-1" style={{ paddingLeft: indent + 32 }}>
      <button
        onClick={handleStartCreating}
        className="flex h-7 items-center gap-1.5 rounded-md px-2 text-sm text-muted transition-colors hover:bg-hover hover:text-fg"
      >
        <Plus size={14} />
        {allowedChildren.length === 1 ? `Add ${allowedChildren[0].name.toLowerCase()}` : "Add child item"}
      </button>
    </div>
  );
}
