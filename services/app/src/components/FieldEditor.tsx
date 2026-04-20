"use client";

import { useState } from "react";
import { Plus, X, Trash2, Braces } from "lucide-react";
import { addFieldDefinition, removeFieldDefinition } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";

interface FieldEditorProps {
  nodeType: any;
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_TYPES = ["TEXT", "NUMBER", "DATE", "CHECKBOX"];

export function FieldEditor({ nodeType, isOpen, onClose }: FieldEditorProps) {
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldName) return;
    await addFieldDefinition(nodeType.id, fieldName, fieldType);
    setFieldName("");
    setIsAdding(false);
  };

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0,0,0,0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass"
        style={{
          width: '100%',
          maxWidth: '500px',
          padding: '32px',
          backgroundColor: 'rgba(15, 15, 20, 0.95)',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Manage Fields</h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Define custom data for {nodeType.name}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </header>

        <div style={{ marginBottom: '32px' }}>
          <h4 style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Braces size={16} /> Existing Fields
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {nodeType.fields.map((field: any) => (
              <div 
                key={field.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '12px 16px',
                  backgroundColor: 'rgba(255,255,255,0.03)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}
              >
                <div>
                  <span style={{ fontWeight: 500 }}>{field.name}</span>
                  <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '12px', padding: '2px 6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                    {field.type}
                  </span>
                </div>
                <button 
                  onClick={() => removeFieldDefinition(field.id)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {nodeType.fields.length === 0 && (
              <p style={{ textAlign: 'center', color: '#4b5563', fontSize: '0.875rem', padding: '20px' }}>
                No custom fields defined yet.
              </p>
            )}
          </div>
        </div>

        {!isAdding ? (
          <button 
            onClick={() => setIsAdding(true)}
            className="button-premium" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Plus size={18} /> Add New Field
          </button>
        ) : (
          <form onSubmit={handleAddField} className="glass" style={{ padding: '20px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: '#6b7280' }}>Field Name</label>
              <input 
                autoFocus
                className="input-premium" 
                placeholder="e.g. Priority, Deadline..." 
                value={fieldName}
                onChange={(e) => setFieldName(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '8px', color: '#6b7280' }}>Field Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {FIELD_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFieldType(type)}
                    style={{
                      padding: '8px',
                      fontSize: '0.75rem',
                      borderRadius: '6px',
                      border: '1px solid',
                      borderColor: fieldType === type ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                      backgroundColor: fieldType === type ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                      color: fieldType === type ? '#3b82f6' : '#9ca3af',
                      cursor: 'pointer'
                    }}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="submit" className="button-premium" style={{ flex: 1 }}>Save Field</button>
              <button 
                type="button" 
                onClick={() => setIsAdding(false)}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#9ca3af', padding: '0 16px', cursor: 'pointer' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
