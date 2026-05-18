"use client";

import { useState, useEffect, useRef } from "react";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/Button";

import { Node, FieldDefinition } from "@/lib/types";

interface NodeEditorProps {
  node: Node;
  onClose: () => void;
}

const AutoGrowingTextarea = ({ id, value, onChange, placeholder }: { id: string, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, placeholder?: string }) => {
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
      id={id}
      ref={textareaRef}
      className="input-premium node-editor-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

export function NodeEditor({ node, onClose }: Readonly<NodeEditorProps>) {
  const [data, setData] = useState<Record<string, unknown>>((node.content as Record<string, unknown>) || {});
  
  const handleChange = (name: string, value: unknown) => {
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    // Implement save action
    onClose();
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="none"
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="modal-content p-2xl" 
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header mb-xl">
          <h3 className="text-editorial text-2xl font-bold">{node.title}</h3>
          <button onClick={onClose} className="button-ghost p-xs text-on-surface-variant">
            <X size={24} />
          </button>
        </header>

        <div className="flex flex-col gap-lg">
          {node.type?.fields?.map((field: FieldDefinition) => (
            <div key={field.id}>
              <label htmlFor={`field-${field.id}`} className="text-meta block text-sm mb-sm text-on-surface-variant">
                {field.name} {field.required && <span className="text-error">*</span>}
              </label>
              
              {field.type === 'TEXT' && (
                <AutoGrowingTextarea 
                  id={`field-${field.id}`}
                  value={(data[field.name] as string) || ''} 
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  placeholder={`Enter ${field.name.toLowerCase()}...`}
                />
              )}
              
              {field.type === 'NUMBER' && (
                <input 
                  id={`field-${field.id}`}
                  type="number"
                  className="input-premium" 
                  value={(data[field.name] as string | number) || ''} 
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'DATE' && (
                <input 
                  id={`field-${field.id}`}
                  type="date"
                  className="input-premium" 
                  value={(data[field.name] as string) || ''} 
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'CHECKBOX' && (
                <input 
                  id={`field-${field.id}`}
                  type="checkbox"
                  checked={(data[field.name] as boolean) || false} 
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                />
              )}
            </div>
          ))}

          {(!node.type?.fields || node.type.fields.length === 0) && (
            <p className="text-on-surface-variant italic text-center p-xl">
              No custom fields configured for this type.
            </p>
          )}
        </div>

        <div className="mt-2xl flex">
          <Button 
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-sm"
          >
            <Save size={18} /> Save Changes
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
