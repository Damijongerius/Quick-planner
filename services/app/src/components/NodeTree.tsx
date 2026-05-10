"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { createNode } from "@/lib/actions";
import { Button } from "./ui/Button";

interface NodeTreeProps {
  projectId: string;
  node: any;
  nodeTypes: any[];
  onSelect: (id: string) => void;
  selectedNodeId: string | null;
}

export function NodeTree({ projectId, node, nodeTypes, onSelect, selectedNodeId }: NodeTreeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<any>(null);

  const isSelected = selectedNodeId === node.id;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;

    await createNode(projectId, node.id, selectedType.id, newNodeTitle);
    setIsCreating(false);
    setNewNodeTitle("");
    setSelectedType(null);
    setIsOpen(true);
  };

  const nodeType = nodeTypes.find(t => t.id === node.nodeTypeId);
  const allowedChildren = nodeType?.allowedChildren?.map((ac: any) => ac.childNodeTypeType) || [];

  return (
    <div className="backlog-tree-node">
      <div 
        className={`backlog-tree-item ${isSelected ? 'active' : ''}`}
        onClick={() => onSelect(node.id)}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          className="backlog-tree-toggle"
        >
          {node.childLinks?.length > 0 ? (
            isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <div className="w-4" />
          )}
        </button>
        <span className="backlog-tree-dot" style={{ backgroundColor: nodeType?.color }}></span>
        <span className={`text-sm ${isSelected ? 'font-bold' : ''}`}>{node.title}</span>
        
        {allowedChildren.length > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsCreating(!isCreating); }}
            className="backlog-tree-add-child"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="backlog-tree-create-form p-sm ml-xl">
          <input 
            autoFocus
            className="input-premium flex-1 min-w-[150px] p-xs text-xs"
            placeholder="New node title..."
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
          />
          <select 
            className="input-premium p-xs text-xs"
            value={selectedType?.id || ""}
            onChange={(e) => setSelectedType(nodeTypes.find(t => t.id === e.target.value))}
            required
          >
            <option value="">Select type...</option>
            {allowedChildren.map((type: any) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <Button type="submit" size="sm">Add</Button>
        </form>
      )}

      {isOpen && node.childLinks?.map((link: any) => (
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
