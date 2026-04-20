"use client";

import { useState, useEffect } from "react";
import { 
  ChevronRight, 
  Plus, 
  Edit2,
  GripVertical,
  Loader2
} from "lucide-react";
import { createNode, getNodeChildren } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { IconRenderer } from "./IconPicker";

interface BacklogTreeProps {
  projectId: string;
  node: any;
  nodeTypes: any[];
  onSelect: (node: any) => void;
  selectedNodeId?: string;
  depth?: number;
}

export function BacklogTree({ projectId, node, nodeTypes, onSelect, selectedNodeId, depth = 0 }: BacklogTreeProps) {
  const [isOpen, setIsOpen] = useState(depth < 1);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [selectedType, setSelectedType] = useState<any>(null);
  const [isHovered, setIsHovered] = useState(false);
  
  const [children, setChildren] = useState<any[]>([]);
  const [isLoadingChildren, setIsLoadingChildren] = useState(false);

  const isSelected = selectedNodeId === node.id;
  const nodeType = nodeTypes.find(t => t.id === node.nodeTypeId) || node.type;
  
  const allowedChildren = nodeType?.allowedChildren?.map((ac: any) => ac.childNodeTypeType) || [];
  
  // Use links if they are already pre-fetched (first 2 levels usually)
  const initialChildren = node.childLinks?.map((l: any) => l.childNode) || [];

  useEffect(() => {
    if (initialChildren.length > 0 && children.length === 0) {
        setChildren(initialChildren);
    }
  }, [node.id]);

  const loadChildren = async () => {
    setIsLoadingChildren(true);
    try {
        const data = await getNodeChildren(projectId, node.id);
        setChildren(data);
    } catch (error) {
        console.error("Failed to load children", error);
    } finally {
        setIsLoadingChildren(false);
    }
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newOpenState = !isOpen;
    setIsOpen(newOpenState);
    if (newOpenState && children.length === 0) {
        loadChildren();
    }
  };

  // Calculate real progress based on children
  const calculateProgress = (): number => {
    const targetNodes = children.length > 0 ? children : initialChildren;
    if (targetNodes.length === 0) {
      return node.status === 'DONE' ? 100 : 0;
    }
    
    const totalProgress = targetNodes.reduce((acc: number, child: any) => {
      return acc + (child.status === 'DONE' ? 100 : (child.status === 'IN_PROGRESS' ? 50 : 0));
    }, 0);
    
    return Math.round(totalProgress / targetNodes.length);
  };

  const progress = calculateProgress();

  // Check for priority in custom fields (case insensitive)
  const getPriority = () => {
    if (!node.content) return null;
    const priorityKey = Object.keys(node.content).find(k => k.toLowerCase() === 'priority');
    return priorityKey ? node.content[priorityKey] : null;
  };

  const priority = getPriority();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeTitle || !selectedType) return;
    await createNode(projectId, node.id, selectedType.id, newNodeTitle);
    setIsCreating(false);
    setNewNodeTitle("");
    setSelectedType(null);
    setIsOpen(true);
    // Refresh children after creation
    loadChildren();
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Node Row */}
      <div 
        className={`backlog-row ${isSelected ? 'selected' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => onSelect(node)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: depth === 0 ? '16px 24px' : `12px 24px 12px ${depth * 40 + 24}px`,
          borderBottom: '1px solid var(--outline-variant)',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
          backgroundColor: isSelected ? 'var(--surface-container-low)' : 'transparent',
          opacity: node.isArchived ? 0.5 : 1
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: 0 }}>
          <div 
            onClick={toggleOpen}
            style={{ 
              color: 'var(--on-surface-variant)', 
              transition: 'transform 0.2s',
              transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              display: (children.length > 0 || initialChildren.length > 0 || isHovered) ? 'block' : 'none',
              width: '16px'
            }}
          >
            {isLoadingChildren ? <Loader2 size={14} className="animate-spin" /> : <ChevronRight size={16} />}
          </div>
          
          <div style={{ color: nodeType?.color || 'var(--primary)', display: 'flex', alignItems: 'center' }}>
            {depth === 0 ? (
                <IconRenderer name={nodeType?.icon || 'Folder'} size={20} color={nodeType?.color || 'var(--primary)'} />
            ) : (
                <IconRenderer name={nodeType?.icon || 'Circle'} size={16} color={nodeType?.color || 'var(--primary)'} />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ 
              fontSize: depth === 0 ? '14px' : '14px', 
              fontWeight: depth === 0 ? 700 : 600,
              color: 'var(--on-surface)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {node.title}
            </span>
            {depth === 0 && (
                <span className="text-meta" style={{ fontSize: '9px', marginTop: '2px', opacity: 0.7 }}>
                  {nodeType?.name || 'Node'}
                </span>
            )}
          </div>

          {priority && (
            <span style={{ 
                fontSize: '9px', 
                fontWeight: 800, 
                padding: '2px 8px', 
                borderRadius: '4px', 
                backgroundColor: priority.toString().toLowerCase() === 'high' ? 'rgba(168, 54, 75, 0.1)' : 'rgba(0, 107, 96, 0.1)', 
                color: priority.toString().toLowerCase() === 'high' ? 'var(--error)' : 'var(--tertiary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
            }}>
                {priority}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          {(children.length > 0 || initialChildren.length > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--on-surface-variant)', fontSize: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
                    <span>{children.length || initialChildren.length} Items</span>
                </div>
                <div style={{ width: '96px', height: '6px', backgroundColor: 'var(--surface-container-highest)', borderRadius: '9999px' }}>
                    <div style={{ width: `${progress}%`, height: '100%', backgroundColor: 'var(--primary)', borderRadius: '9999px', transition: 'width 0.5s ease-out' }}></div>
                </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '4px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}>
             {allowedChildren.length > 0 && (
                 <button 
                    className="button-secondary" 
                    title="Add Child"
                    style={{ border: 'none', padding: '4px' }}
                    onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
                 >
                    <Plus size={16} />
                 </button>
             )}
             <button className="button-secondary" title="Reorder" style={{ border: 'none', padding: '4px' }}>
                <GripVertical size={16} />
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
            style={{ marginLeft: `${depth * 40 + 64}px`, marginTop: '8px', marginBottom: '8px', zIndex: 10, position: 'relative' }}
          >
            <div className="glass" style={{ padding: '16px', width: '280px' }}>
              <p className="text-meta" style={{ marginBottom: '12px' }}>Add Strategic Component</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {allowedChildren.map((type: any) => (
                  <button 
                    key={type.id}
                    onClick={() => {
                      setSelectedType(type);
                      setIsCreating(true);
                      setShowAddMenu(false);
                    }}
                    className="button-secondary"
                    style={{ fontSize: '10px', color: type.color, borderColor: `${type.color}40`, fontWeight: 700 }}
                  >
                    {type.name.toUpperCase()}
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
            style={{ marginLeft: `${depth * 40 + 64}px`, marginTop: '12px', marginBottom: '12px' }}
          >
            <form onSubmit={handleCreate} className="glass" style={{ padding: '12px', display: 'flex', gap: '8px', border: `1px solid ${selectedType?.color}40` }}>
              <input 
                autoFocus
                className="input-premium"
                style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px' }}
                placeholder={`Name your ${selectedType?.name}...`}
                value={newNodeTitle}
                onChange={(e) => setNewNodeTitle(e.target.value)}
              />
              <button type="submit" className="button-premium" style={{ padding: '8px 16px', fontSize: '12px', backgroundColor: selectedType?.color }}>
                Add
              </button>
              <button 
                type="button" 
                onClick={() => setIsCreating(false)}
                style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Children Container */}
      {isOpen && (
        <div className="children-container">
          {(children.length > 0 ? children : initialChildren).map((child: any) => (
            <BacklogTree 
              key={child.id} 
              projectId={projectId}
              node={child} 
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
