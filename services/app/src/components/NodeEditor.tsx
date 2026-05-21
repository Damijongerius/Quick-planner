"use client";

import { useState, useEffect, useRef } from "react";
import { X, Save } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import { Checkbox } from "./ui/Checkbox";

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
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface shrink-0">
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
                <Input 
                  id={`field-${field.id}`}
                  type="number"
                  variant="premium"
                  value={(data[field.name] as string | number) || ''} 
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'DATE' && (
                <Input 
                  id={`field-${field.id}`}
                  type="date"
                  variant="premium"
                  value={(data[field.name] as string) || ''} 
                  onChange={(e) => handleChange(field.name, e.target.value)}
                />
              )}

              {field.type === 'CHECKBOX' && (
                <Checkbox 
                  id={`field-${field.id}`}
                  checked={(data[field.name] as boolean) || false} 
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  label={`Enable ${field.name.toLowerCase()}`}
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
