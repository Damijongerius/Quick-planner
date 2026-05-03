"use client";

import { useState, useEffect, useRef } from "react";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";

interface NodeEditorProps {
  node: any;
  onClose: () => void;
}

export function NodeEditor({ node, onClose }: NodeEditorProps) {
  const [data, setData] = useState(node.content || {});
  
  const AutoGrowingTextarea = ({ value, onChange, placeholder, style }: any) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
      if (textareaRef.current) {
        textareaRef.current.style.height = '0px';
        const scrollHeight = textareaRef.current.scrollHeight;
        textareaRef.current.style.height = scrollHeight + 'px';
      }
    }, [value]);

    return (
      <textarea
        ref={textareaRef}
        className="input-premium"
        style={{ 
          ...style, 
          padding: '12px 16px', 
          borderRadius: '12px', 
          minHeight: '40px',
          resize: 'none',
          overflow: 'hidden',
          lineHeight: '1.5',
          paddingLeft: '16px' // NodeEditor doesn't have the icon space as large usually
        }}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    );
  };

  const handleChange = (name: string, value: any) => {
    setData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Implement save action
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass" 
      style={{ 
        position: 'fixed', 
        top: '50%', 
        left: '50%', 
        transform: 'translate(-50%, -50%)', 
        zIndex: 1000,
        width: '500px',
        padding: '32px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{node.title}</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {node.type?.fields?.map((field: any) => (
          <div key={field.id}>
            <label style={{ display: 'block', fontSize: '0.875rem', marginBottom: '8px', color: '#9ca3af' }}>
              {field.name} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            
            {field.type === 'TEXT' && (
              <AutoGrowingTextarea 
                value={data[field.name] || ''} 
                onChange={(e: any) => handleChange(field.name, e.target.value)}
                placeholder={`Enter ${field.name.toLowerCase()}...`}
              />
            )}
            
            {field.type === 'NUMBER' && (
              <input 
                type="number"
                className="input-premium" 
                value={data[field.name] || ''} 
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            )}

            {field.type === 'DATE' && (
              <input 
                type="date"
                className="input-premium" 
                value={data[field.name] || ''} 
                onChange={(e) => handleChange(field.name, e.target.value)}
              />
            )}

            {field.type === 'CHECKBOX' && (
              <input 
                type="checkbox"
                checked={data[field.name] || false} 
                onChange={(e) => handleChange(field.name, e.target.checked)}
              />
            )}
          </div>
        ))}

        {(!node.type?.fields || node.type.fields.length === 0) && (
          <p style={{ color: '#4b5563', fontStyle: 'italic', textAlign: 'center', padding: '20px' }}>
            No custom fields configured for this type.
          </p>
        )}
      </div>

      <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
        <button className="button-premium" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <Save size={18} /> Save Changes
        </button>
      </div>
    </motion.div>
  );
}
