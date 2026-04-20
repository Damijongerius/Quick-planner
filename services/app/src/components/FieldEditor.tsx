"use client";

import { useState } from "react";
import { Plus, X, Trash2, Type, Hash, Calendar, CheckCircle2 } from "lucide-react";
import { addFieldDefinition, removeFieldDefinition } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

interface FieldEditorProps {
  projectId: string;
  nodeType: any;
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_TYPES = [
    { type: "TEXT", icon: Type },
    { type: "NUMBER", icon: Hash },
    { type: "DATE", icon: Calendar },
    { type: "CHECKBOX", icon: CheckCircle2 }
];

export function FieldEditor({ projectId, nodeType, isOpen, onClose }: FieldEditorProps) {
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName) return;
    await addFieldDefinition(projectId, nodeType.id, fieldName, fieldType);
    setFieldName("");
    setIsAdding(false);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(44, 52, 55, 0.4)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="card-sanctuary"
        style={{
          width: '100%',
          maxWidth: '520px',
          padding: 0,
          backgroundColor: 'var(--surface-container-lowest)',
          overflow: 'hidden',
          borderRadius: '32px',
          boxShadow: 'var(--ambient-shadow)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '32px 40px', borderBottom: '1px solid var(--outline-variant)' }}>
          <div>
            <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--on-surface)' }}>Attribute Governance</h3>
            <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontWeight: 500 }}>Defining data structures for {nodeType.name}</p>
          </div>
          <button onClick={onClose} className="button-secondary" style={{ padding: '8px', border: 'none' }}>
            <X size={20} />
          </button>
        </header>

        <div style={{ padding: '40px', maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: '32px' }}>
            <label className="text-meta" style={{ display: 'block', marginBottom: '16px' }}>Active Attributes</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {nodeType.fields.map((field: any) => {
                const typeInfo = FIELD_TYPES.find(t => t.type === field.type);
                const Icon = typeInfo?.icon || Type;
                
                return (
                  <div 
                    key={field.id} 
                    className="card-sanctuary"
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '16px 24px',
                      backgroundColor: 'var(--surface-container-low)',
                      borderRadius: '16px',
                      boxShadow: 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ color: 'var(--primary)' }}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{field.name}</span>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--on-surface-variant)', marginLeft: '12px', textTransform: 'uppercase', opacity: 0.6 }}>
                          {field.type}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFieldDefinition(projectId, field.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
              {nodeType.fields.length === 0 && (
                <div style={{ padding: '32px', textAlign: 'center', backgroundColor: 'var(--surface-container-low)', borderRadius: '16px', border: '1px dashed var(--outline-variant)' }}>
                  <p style={{ color: 'var(--on-surface-variant)', fontSize: '14px', fontStyle: 'italic' }}>
                    No attributes defined for this node type.
                  </p>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {!isAdding ? (
              <button 
                onClick={() => setIsAdding(true)}
                className="button-premium" 
                style={{ width: '100%', padding: '16px' }}
              >
                <Plus size={18} /> Add New Attribute
              </button>
            ) : (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddField} 
                style={{ backgroundColor: 'var(--surface-container-low)', padding: '24px', borderRadius: '24px' }}
              >
                <div style={{ marginBottom: '24px' }}>
                  <label className="text-meta" style={{ display: 'block', marginBottom: '8px' }}>Attribute Identity</label>
                  <input 
                    autoFocus
                    className="input-premium" 
                    placeholder="e.g. Priority, Estimate, ROI..." 
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    required
                    style={{ paddingLeft: '20px' }}
                  />
                </div>
                <div style={{ marginBottom: '32px' }}>
                  <label className="text-meta" style={{ display: 'block', marginBottom: '12px' }}>Data Format</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    {FIELD_TYPES.map(({ type, icon: Icon }) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFieldType(type)}
                        className="button-secondary"
                        style={{
                          justifyContent: 'center',
                          padding: '12px',
                          backgroundColor: fieldType === type ? 'var(--surface-container-lowest)' : 'transparent',
                          borderColor: fieldType === type ? 'var(--primary)' : 'var(--outline-variant)',
                          color: fieldType === type ? 'var(--primary)' : 'var(--on-surface-variant)',
                          fontWeight: fieldType === type ? 800 : 600,
                          fontSize: '11px'
                        }}
                      >
                        <Icon size={14} style={{ marginRight: '8px' }} />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" className="button-premium" style={{ flex: 1, padding: '12px' }}>Initialize Attribute</button>
                  <button 
                    type="button" 
                    onClick={() => setIsAdding(false)}
                    className="button-secondary"
                    style={{ border: 'none' }}
                  >
                    Discard
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <footer style={{ padding: '32px 40px', borderTop: '1px solid var(--outline-variant)', textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'var(--on-surface-variant)', fontWeight: 500, opacity: 0.6 }}>
                Changes to governance rules are synchronized across all nodes of this type.
            </p>
        </footer>
      </motion.div>
    </div>
  );
}
