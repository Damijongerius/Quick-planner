"use client";

import React, { useEffect, useRef } from "react";
import { Type, Hash, Calendar, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { FormField } from "./ui/FormField";

interface Field {
  id: string;
  name: string;
  type: "TEXT" | "NUMBER" | "DATE" | "CHECKBOX";
}

interface CustomFieldRendererProps {
  fields: Field[];
  content: any;
  onChange: (fieldName: string, value: any) => void;
}

const AutoGrowingTextarea = ({ value, onChange, placeholder }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.max(44, scrollHeight) + 'px';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      className="input-premium auto-growing-textarea"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
    />
  );
};

export function CustomFieldRenderer({ fields, content, onChange }: CustomFieldRendererProps) {
  if (!fields || fields.length === 0) return null;

  return (
    <div className="flex flex-col gap-lg">
      {fields.map((field) => (
        <FormField 
          key={field.id} 
          label={field.name}
        >
          {field.type === 'TEXT' && (
            <AutoGrowingTextarea 
              value={content[field.name] || ""}
              onChange={(e: any) => onChange(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}...`}
            />
          )}
          
          {field.type === 'NUMBER' && (
            <input 
              type="number"
              className="input-premium p-md"
              value={content[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
            />
          )}
          
          {field.type === 'DATE' && (
            <input 
              type="date"
              className="input-premium p-md"
              value={content[field.name] || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
            />
          )}
          
          {field.type === 'CHECKBOX' && (
            <div 
              onClick={() => onChange(field.name, !content[field.name])}
              className={`toggle-track ${content[field.name] ? 'active' : ''}`}
            >
              <motion.div 
                animate={{ x: content[field.name] ? 20 : 0 }}
                className="toggle-thumb"
              />
            </div>
          )}
        </FormField>
      ))}
    </div>
  );
}
