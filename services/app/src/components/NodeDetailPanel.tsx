"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Tag, Box, AlertTriangle, Trash2, Save } from "lucide-react";
import { getNode, deleteNode, updateNode } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { IconRenderer } from "./IconPicker";

interface NodeDetailPanelProps {
  nodeId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

export function NodeDetailPanel({ nodeId, onClose, onUpdate }: NodeDetailPanelProps) {
  const [node, setNode] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");

  useEffect(() => {
    if (nodeId) {
      const loadNode = async () => {
        setLoading(true);
        const data = await getNode(nodeId);
        setNode(data);
        setEditTitle(data?.title || "");
        setLoading(false);
      };
      loadNode();
    } else {
      setNode(null);
    }
  }, [nodeId]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this node?")) {
      await deleteNode(node.id);
      onUpdate();
      onClose();
    }
  };

  const handleSaveTitle = async () => {
    if (editTitle.trim() === node.title) {
      setIsEditing(false);
      return;
    }
    await updateNode(node.id, { title: editTitle });
    setIsEditing(false);
    onUpdate();
  };

  if (!nodeId) return null;

  return (
    <AnimatePresence>
      {nodeId && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          />
          
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="glass"
            style={{ 
              position: 'relative', 
              width: '100%', 
              maxWidth: '500px', 
              height: '100%', 
              backgroundColor: 'rgba(20, 20, 25, 0.98)',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-20px 0 50px rgba(0,0,0,0.5)',
              borderLeft: '1px solid rgba(255,255,255,0.05)'
            }}
          >
            {/* Header */}
            <header style={{ padding: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: `${node?.type?.color}20` }}>
                    <IconRenderer name={node?.type?.icon} color={node?.type?.color} size={18} />
                  </div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: node?.type?.color, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {node?.type?.name}
                  </span>
                </div>
                
                {isEditing ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      autoFocus
                      className="input-premium"
                      style={{ fontSize: '1.5rem', fontWeight: 600, flex: 1 }}
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    />
                    <button onClick={handleSaveTitle} className="button-premium" style={{ padding: '8px' }}>
                      <Save size={18} />
                    </button>
                  </div>
                ) : (
                  <h2 
                    onClick={() => setIsEditing(true)}
                    style={{ fontSize: '1.5rem', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {node?.title || "Loading..."}
                  </h2>
                )}
              </div>
              <button 
                onClick={onClose} 
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '8px' }}
              >
                <X size={24} />
              </button>
            </header>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>Loading details...</div>
            ) : node && (
              <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                {/* Meta Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                  <div className="glass" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <Tag size={12} /> Status
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{node.status}</div>
                  </div>
                  <div className="glass" style={{ padding: '16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '8px' }}>
                      <Calendar size={12} /> Created
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                      {new Date(node.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {/* Custom Fields */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Fields</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {node.type?.fields.map((field: any) => (
                      <div key={field.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>{field.name}</span>
                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                          {node.content?.[field.id] || <span style={{ opacity: 0.3 }}>N/A</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Relations */}
                <div style={{ marginBottom: '40px' }}>
                  <h3 style={{ fontSize: '0.75rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Relations</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {node.parentLinks?.map((link: any) => (
                      <div key={link.id} className="glass" style={{ padding: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(59, 130, 246, 0.05)' }}>
                        <Box size={14} color="#3b82f6" />
                        <span style={{ opacity: 0.6 }}>Parent:</span>
                        <span>{link.parentNode.title}</span>
                      </div>
                    ))}
                    {node.childLinks?.map((link: any) => (
                      <div key={link.id} className="glass" style={{ padding: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Box size={14} />
                        <span style={{ opacity: 0.6 }}>Child:</span>
                        <span>{link.childNode.title}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Blocking */}
                {(node.blockedBy?.length > 0 || node.blocking?.length > 0) && (
                  <div style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Dependencies</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {node.blockedBy?.map((block: any) => (
                        <div key={block.id} className="glass" style={{ padding: '12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                          <AlertTriangle size={14} color="#ef4444" />
                          <span style={{ opacity: 0.6, color: '#ef4444' }}>Blocked By:</span>
                          <span>{block.blockingNode.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer */}
            <footer style={{ padding: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleDelete}
                style={{ background: 'none', border: 'none', color: '#ef4444', opacity: 0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.5'}
              >
                <Trash2 size={16} /> Delete Node
              </button>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
