"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Plus } from "lucide-react";
import { createNode } from "@/lib/actions";

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
    <div style={{ marginLeft: '1rem' }}>
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          padding: '0.5rem',
          backgroundColor: isSelected ? '#3b82f620' : 'transparent',
          borderRadius: '0.25rem',
          cursor: 'pointer'
        }}
        onClick={() => onSelect(node.id)}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {node.childLinks?.length > 0 ? (
            isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <div style={{ width: 16 }} />
          )}
        </button>
        <span style={{ color: nodeType?.color }}>•</span>
        <span style={{ fontWeight: isSelected ? 600 : 400 }}>{node.title}</span>
        
        {allowedChildren.length > 0 && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsCreating(!isCreating); }}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5 }}
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} style={{ marginLeft: '2rem', padding: '0.5rem', border: '1px solid #374151', borderRadius: '0.25rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input 
            autoFocus
            style={{ flex: 1, minWidth: '150px', background: 'none', border: '1px solid #4b5563', color: 'white', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}
            placeholder="New node title..."
            value={newNodeTitle}
            onChange={(e) => setNewNodeTitle(e.target.value)}
          />
          <select 
            style={{ background: '#1f2937', color: 'white', border: '1px solid #4b5563', borderRadius: '0.25rem' }}
            value={selectedType?.id || ""}
            onChange={(e) => setSelectedType(nodeTypes.find(t => t.id === e.target.value))}
            required
          >
            <option value="">Select type...</option>
            {allowedChildren.map((type: any) => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <button type="submit" style={{ backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '0.25rem', cursor: 'pointer' }}>Add</button>
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
