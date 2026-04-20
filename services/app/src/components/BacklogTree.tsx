"use client";

import { useState } from "react";
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  Copy, 
  Archive, 
  Trash2, 
  Calendar,
  ArchiveRestore
} from "lucide-react";
import { createNode, duplicateNode, archiveNode, deleteNode } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { IconRenderer } from "./IconPicker";

interface BacklogTreeProps {
  node: any;
  nodeTypes: any[];
  onSelect: (node: any) => void;
  selectedNodeId?: string;
  depth?: number;
}

export function BacklogTree({ node, nodeTypes, onSelect, selectedNodeId, depth = 0 }: BacklogTreeProps) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<any>(null);
  const [isActionsVisible, setIsActionsVisible] = useState(false);

  const isSelected = selectedNodeId === node.id;
  const nodeType = nodeTypes.find(t => t.id === node.nodeTypeId) || node.type;
  
  const allowedChildren = nodeType?.allowedChildren?.map((ac: any) => ac.childNodeTypeType) || [];

  // Get the first field's value for preview
  const firstField = nodeType?.fields?.[0]?.name;
  const fieldValue = firstField ? node.content?.[firstField] : null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;
    await createNode(node.id, selectedType.id, newNodeTitle);
    setIsCreating(false);
    setNewNodeTitle("");
    setSelectedType(null);
    setIsOpen(true);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await archiveNode(node.id, !node.isArchived);
  };

  const handleDuplicate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateNode(node.id);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this node and all its children?")) {
      await deleteNode(node.id);
    }
  };

  return (
    <div style={{ marginLeft: depth > 0 ? '20px' : 0 }}>
      {/* Node Row */}
      <div 
        className={`backlog-item ${isSelected ? 'selected' : ''}`}
        onMouseEnter={() => setIsActionsVisible(true)}
        onMouseLeave={() => setIsActionsVisible(false)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: '10px 16px', 
          marginBottom: '2px',
          borderRadius: '10px',
          cursor: 'pointer',
          backgroundColor: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
          border: isSelected ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
          transition: 'all 0.2s',
          position: 'relative',
          opacity: node.isArchived ? 0.4 : 1
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node);
        }}
      >
        {/* COL 1: Main info */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
          <div 
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280', marginRight: '4px' }}
          >
            {node.childLinks?.length > 0 && (
              isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
            )}
          </div>

          <div style={{ marginRight: '12px', color: nodeType?.color || '#3b82f6', display: 'flex', alignItems: 'center' }}>
            <IconRenderer name={nodeType?.icon || 'Circle'} size={18} />
          </div>

          <span style={{ 
            fontSize: '0.9rem', 
            fontWeight: 500, 
            color: isSelected ? '#fff' : '#d1d5db',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginRight: '12px'
          }}>
            {node.title}
          </span>
        </div>

        {/* COL 2: Field Preview */}
        {fieldValue && (
          <div style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280', 
            marginRight: '24px', 
            backgroundColor: 'rgba(255,255,255,0.03)', 
            padding: '2px 8px', 
            borderRadius: '6px',
            maxWidth: '120px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis'
          }}>
            {fieldValue.toString()}
          </div>
        )}

        {/* COL 3 & 4: Meta & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Date Stamp */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4b5563', fontSize: '0.7rem', whiteSpace: 'nowrap' }}>
            <Calendar size={12} />
            {new Date(node.updatedAt).toLocaleDateString()}
          </div>

          {/* Action Group */}
          <div 
            style={{ 
              display: 'flex', 
              gap: '2px', 
              opacity: isActionsVisible || isSelected ? 1 : 0,
              transition: 'opacity 0.2s',
              backgroundColor: 'rgba(0,0,0,0.2)',
              padding: '2px',
              borderRadius: '8px'
            }}
          >
             <button 
               title="Archive"
               onClick={handleArchive}
               style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
             >
               {node.isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
             </button>
             <button 
               title="Duplicate"
               onClick={handleDuplicate}
               style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
             >
               <Copy size={14} />
             </button>
             {allowedChildren.length > 0 && (
               <button 
                 title="Add Child"
                 onClick={(e) => {
                   e.stopPropagation();
                   setShowAddMenu(!showAddMenu);
                   setIsCreating(false);
                 }}
                 style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
               >
                 <Plus size={14} />
               </button>
             )}
             <button 
               title="Delete"
               onClick={handleDelete}
               style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}
             >
               <Trash2 size={14} />
             </button>
          </div>
        </div>
      </div>

      {/* Add Menus */}
      <AnimatePresence>
        {showAddMenu && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ marginLeft: '44px', marginBottom: '8px', zIndex: 10, position: 'relative' }}
          >
            <div className="glass" style={{ padding: '10px', width: '220px', backgroundColor: 'rgba(15, 15, 20, 0.95)' }}>
              <p style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '8px', textTransform: 'uppercase' }}>Add Child</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allowedChildren.map((type: any) => (
                  <button 
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type);
                      setIsCreating(true);
                      setShowAddMenu(false);
                    }}
                    style={{ 
                      fontSize: '0.65rem', 
                      padding: '4px 8px', 
                      borderRadius: '6px', 
                      backgroundColor: `${type.color}20`, 
                      color: type.color,
                      border: `1px solid ${type.color}40`,
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
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginLeft: '44px', marginBottom: '12px' }}
          >
            <form onSubmit={handleCreate} className="glass" style={{ padding: '8px', display: 'flex', gap: '8px', border: `1px solid ${selectedType?.color}40` }}>
              <input 
                autoFocus
                className="input-premium"
                style={{ padding: '4px 8px', fontSize: '0.8rem' }}
                placeholder={`Name your ${selectedType?.name}...`}
                value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
              />
              <button type="submit" className="button-premium" style={{ padding: '4px 10px', fontSize: '0.7rem', backgroundColor: selectedType?.color }}>
                Add
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children */}
      {isOpen && (
        <div style={{ borderLeft: '1px solid rgba(255,255,255,0.03)', marginLeft: '11px' }}>
          {node.childLinks?.map((link: any) => (
            <BacklogTree 
              key={link.id} 
              node={link.childNode} 
              nodeTypes={nodeTypes} 
              onSelect={onSelect}
              selectedNodeId={selectedNodeId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
