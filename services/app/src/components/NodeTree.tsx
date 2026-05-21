"use client";

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { createNode } from "@/lib/actions";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";

import { Node, NodeType } from "@/lib/types";

interface NodeTreeProps {
  projectId: string;
  node: Node;
  nodeTypes: NodeType[];
  onSelect: (id: string) => void;
  selectedNodeId: string | null;
}

function ToggleIcon({ isOpen }: { isOpen: boolean }) {
  if (isOpen) return <ChevronDown size={16} />;
  return <ChevronRight size={16} />;
}

export function NodeTree({ projectId, node, nodeTypes, onSelect, selectedNodeId }: Readonly<NodeTreeProps>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<NodeType | null>(null);

  const isSelected = selectedNodeId === node.id;

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;

    await createNode(projectId, node.id, selectedType.id, newNodeTitle);
    setIsCreating(false);
    setNewNodeTitle("");
    setSelectedType(null);
    setIsOpen(true);
  };

  const handleToggleCreating = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextCreating = !isCreating;
    setIsCreating(nextCreating);
    if (nextCreating && allowedChildren.length === 1) {
      setSelectedType(allowedChildren[0]);
    }
  };

  const nodeType = nodeTypes.find((t) => t.id === node.nodeTypeId);
  const allowedChildren = nodeType?.allowedChildren?.map((ac) => ac.childNodeTypeType) || [];

  return (
    <div className="backlog-tree-node">
      <div className={`backlog-tree-item ${isSelected ? 'active' : ''}`}>
        <button 
          className="backlog-tree-item-action"
          onClick={() => onSelect(node.id)}
          aria-label={`Select ${node.title}`}
        />
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="backlog-tree-toggle relative z-10"
        >
          {node.childLinks && node.childLinks.length > 0 ? (
            <ToggleIcon isOpen={isOpen} />
          ) : (
            <div className="w-4" />
          )}
        </button>
        <span className="backlog-tree-dot" style={{ backgroundColor: nodeType?.color || 'var(--primary)' }}></span>
        <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{node.title}</span>
        
        {allowedChildren.length > 0 && (
          <button 
            onClick={handleToggleCreating}
            className="backlog-tree-add-child"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="backlog-tree-create-form p-sm ml-xl">
          <Input 
            autoFocus
            className="flex-1 min-w-[150px] p-xs text-xs"
            placeholder="New node title..."
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
          />
          <div style={{ minWidth: '120px' }}>
            <Select 
              options={allowedChildren.map((type) => ({ value: type.id, label: type.name }))}
              value={selectedType?.id || ""}
              onChange={(val) => setSelectedType(nodeTypes.find((t) => t.id === val) || null)}
              placeholder="Select type..."
              triggerClassName="p-xs text-xs h-[30px]"
            />
          </div>
          <Button type="submit" size="sm">Add</Button>
        </form>
      )}

      {isOpen && [...(node.childLinks || [])]
        .sort((a, b) => new Date(a.childNode.createdAt).getTime() - new Date(b.childNode.createdAt).getTime())
        .map((link) => (
          <NodeTree 
            key={link.id} 
            projectId={projectId}
            node={link.childNode} 
            nodeTypes={nodeTypes} 
            onSelect={onSelect}
            selectedNodeId={selectedNodeId}
          />
        ))}
    </div>
  );
}
