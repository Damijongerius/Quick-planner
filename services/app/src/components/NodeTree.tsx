"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Plus, MoreVertical } from "lucide-react";
import { createNode } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

interface NodeTreeProps {
  node: any;
  nodeTypes: any[];
}

export function NodeTree({ node, nodeTypes }: NodeTreeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<any>(null);

  const nodeType = nodeTypes.find(t => t.id === node.nodeTypeId);
  const allowedChildren = nodeType?.allowedChildren?.map((ac: any) => ac.childNodeTypeType) || [];

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;
    
    await createNode(node.id, selectedType.id, newNodeTitle);
    setIsCreating(false);
    setNewNodeTitle("");
    setSelectedType(null);
    setIsOpen(true);
  };

  return (
    <div style={{ marginLeft: '12px', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
      <div 
        className="glass" 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '8px 16px', 
          marginBottom: '4px',
          backgroundColor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '8px'
        }}
      >
        <div 
          onClick={() => setIsOpen(!isOpen)} 
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
        >
          {node.childLinks?.length > 0 ? (
            isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />
          ) : (
            <div style={{ width: 16 }} />
          )}
          
          <div 
            style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: node.type?.color || '#3b82f6' 
            }} 
          />
          
          <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{node.title}</span>
          <span style={{ fontSize: '0.7rem', color: '#6b7280', marginLeft: '8px', textTransform: 'uppercase' }}>
            {node.type?.name}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {allowedChildren.length > 0 && (
            <button 
              onClick={() => {
                setShowAddMenu(!showAddMenu);
                setIsCreating(false);
              }}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
            >
              <Plus size={16} />
            </button>
          )}
          <button style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAddMenu && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ marginLeft: '32px', marginBottom: '12px' }}
          >
            <div className="glass" style={{ padding: '12px', width: '240px' }}>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px' }}>Add Child Node</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {allowedChildren.map((type: any) => (
                  <button 
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type);
                      setIsCreating(true);
                      setShowAddMenu(false);
                    }}
                    style={{ 
                      fontSize: '0.7rem', 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      backgroundColor: type.color || '#3b82f6', 
                      color: '#fff',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {isCreating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ marginLeft: '32px', marginBottom: '12px' }}
          >
            <form onSubmit={handleCreate} className="glass" style={{ padding: '12px', display: 'flex', gap: '8px' }}>
              <input 
                autoFocus
                className="input-premium"
                style={{ padding: '4px 8px', fontSize: '0.875rem' }}
                placeholder={`Name your ${selectedType?.name}...`}
                value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
              />
              <button type="submit" className="button-premium" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                Add
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {isOpen && (
        <div style={{ paddingLeft: '12px' }}>
          {node.childLinks?.map((link: any) => (
            <NodeTree key={link.id} node={link.childNode} nodeTypes={nodeTypes} />
          ))}
        </div>
      )}
    </div>
  );
}
