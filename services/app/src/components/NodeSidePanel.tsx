"use client";

import { useState, useEffect, useRef } from "react";
import { X, Trash2, Calendar, Hash, Type, CheckCircle2, Info, Clock, Check, Layers, Zap, Link, Trash } from "lucide-react";
import { updateNode, deleteNode, assignNodeToSprint, updateNodeStatus, addDependency, removeDependency } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { IconRenderer } from "./IconPicker";

interface NodeSidePanelProps {
  node: any;
  isOpen: boolean;
  onClose: () => void;
  sprints: any[];
  allNodes: any[];
}

export function NodeSidePanel({ node, isOpen, onClose, sprints, allNodes }: NodeSidePanelProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState<any>({});
  const [sprintId, setSprintId] = useState<string | null>(null);
  const [status, setStatus] = useState("TODO");
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const isInitialMount = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync state with node prop
  useEffect(() => {
    if (node) {
      setTitle(node.title || "");
      setContent(node.content || {});
      setSprintId(node.sprintId || null);
      setStatus(node.status || "TODO");
      setSavingStatus('idle');
      isInitialMount.current = true;
    }
  }, [node?.id, node?.updatedAt]); // Re-sync if node ID or server timestamp changes

  // Auto-save logic
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setSavingStatus('saving');
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await updateNode(node.id, { title, content });
        setSavingStatus('saved');
        setTimeout(() => setSavingStatus('idle'), 2000);
      } catch (error) {
        console.error("Auto-save failed", error);
        setSavingStatus('idle');
      }
    }, 500);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [title, content]);

  if (!node) return null;

  const handleFieldChange = (fieldName: string, value: any) => {
    setContent((prev: any) => ({ ...prev, [fieldName]: value }));
  };

  const handleSprintChange = async (newSprintId: string | null) => {
    setSprintId(newSprintId);
    await assignNodeToSprint(node.id, newSprintId || null);
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    await updateNodeStatus(node.id, newStatus);
  };

  const handleAddDependency = async (blockingId: string) => {
     if (blockingId && blockingId !== 'none') {
        await addDependency(node.id, blockingId);
     }
  };

  return (
    <div className="glass" style={{ 
      height: '100%', 
      width: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderLeft: '1px solid rgba(255,255,255,0.05)',
      backgroundColor: 'rgba(15, 15, 20, 0.4)',
      overflow: 'hidden'
    }}>
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '24px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <IconRenderer name={node.type?.icon} color={node.type?.color} size={20} />
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {node.type?.name}
          </span>
          <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
             {savingStatus === 'saving' && <span style={{ fontSize: '0.65rem', color: '#3b82f6' }}>Saving...</span>}
             {savingStatus === 'saved' && (
               <span style={{ fontSize: '0.65rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <Check size={12} /> Saved
               </span>
             )}
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </header>

      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <input 
          className="input-premium"
          style={{ 
            fontSize: '1.5rem', 
            fontWeight: 700, 
            background: 'none', 
            border: 'none', 
            padding: 0, 
            marginBottom: '32px',
            boxShadow: 'none',
            color: '#fff'
          }}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Item title..."
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Status & Sprint Selection */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#4b5563', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>
                <Zap size={14} /> Status
              </label>
              <select 
                className="input-premium" 
                value={status}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{ width: '100%', cursor: 'pointer' }}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Completed</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#4b5563', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase' }}>
                <Layers size={14} /> Sprint
              </label>
              <select 
                className="input-premium" 
                value={sprintId || "none"}
                onChange={(e) => handleSprintChange(e.target.value === 'none' ? null : e.target.value)}
                style={{ width: '100%', cursor: 'pointer' }}
              >
                <option value="none">Backlog</option>
                {sprints.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.status})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dependencies Section */}
          <div style={{ padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#4b5563', marginBottom: '16px', fontWeight: 600, textTransform: 'uppercase' }}>
              <Link size={14} /> Blocked By
            </label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              {node.blockedBy?.map((dep: any) => (
                <div key={dep.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', backgroundColor: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <span style={{ fontSize: '0.8rem', color: '#e5e7eb' }}>{dep.blockingNode?.title}</span>
                  <button 
                    onClick={() => removeDependency(dep.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
              {(!node.blockedBy || node.blockedBy.length === 0) && (
                <p style={{ fontSize: '0.75rem', color: '#4b5563', fontStyle: 'italic' }}>No dependencies.</p>
              )}
            </div>

            <select 
              className="input-premium"
              value="none"
              onChange={(e) => handleAddDependency(e.target.value)}
              style={{ width: '100%', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              <option value="none">+ Add Dependency...</option>
              {allNodes
                .filter(n => n.id !== node.id && !node.blockedBy?.some((d: any) => d.blockingNodeId === n.id))
                .map(n => (
                  <option key={n.id} value={n.id}>{n.title}</option>
                ))
              }
            </select>
          </div>

          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4b5563', textTransform: 'uppercase', marginBottom: '16px', letterSpacing: '0.05em' }}>Custom Fields</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {node.type?.fields?.map((field: any) => (
                <div key={field.id}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '8px', fontWeight: 500 }}>
                    {field.type === 'TEXT' && <Type size={14} />}
                    {field.type === 'NUMBER' && <Hash size={14} />}
                    {field.type === 'DATE' && <Calendar size={14} />}
                    {field.type === 'CHECKBOX' && <CheckCircle2 size={14} />}
                    {field.name}
                  </label>
                  
                  {field.type === 'TEXT' && (
                    <input 
                      className="input-premium"
                      value={content[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                  )}
                  
                  {field.type === 'NUMBER' && (
                    <input 
                      type="number"
                      className="input-premium"
                      value={content[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    />
                  )}
                  
                  {field.type === 'DATE' && (
                    <input 
                      type="date"
                      className="input-premium"
                      value={content[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      style={{ colorScheme: 'dark' }}
                    />
                  )}
                  
                  {field.type === 'CHECKBOX' && (
                    <div 
                      onClick={() => handleFieldChange(field.name, !content[field.name])}
                      style={{ 
                        width: '40px', 
                        height: '20px', 
                        borderRadius: '10px', 
                        backgroundColor: content[field.name] ? node.type?.color : 'rgba(255,255,255,0.1)',
                        position: 'relative',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <motion.div 
                        animate={{ x: content[field.name] ? 20 : 0 }}
                        style={{ 
                          width: '16px', 
                          height: '16px', 
                          borderRadius: '50%', 
                          backgroundColor: 'white', 
                          position: 'absolute', 
                          top: '2px', 
                          left: '2px' 
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {(!node.type?.fields || node.type.fields.length === 0) && (
                <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.05)' }}>
                  <p style={{ color: '#4b5563', fontSize: '0.875rem' }}>No custom fields defined.</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Section */}
          <div style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', marginBottom: '16px' }}>
              <Info size={14} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>Details</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Created</span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} /> {new Date(node.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Last Active</span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={12} /> {new Date(node.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button 
          type="button"
          onClick={async () => {
             if (confirm("Are you sure you want to delete this node and all its children?")) {
               await deleteNode(node.id);
               onClose();
             }
          }}
          style={{ 
            background: 'none', 
            border: '1px solid rgba(239, 68, 68, 0.1)', 
            borderRadius: '12px', 
            color: '#ef4444', 
            width: '100%',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          <Trash2 size={16} /> Delete Node
        </button>
      </footer>
    </div>
  );
}
