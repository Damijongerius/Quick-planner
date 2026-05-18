"use client";

import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FormField } from "./ui/FormField";

import { FieldDefinition } from "@/lib/types";

interface CustomFieldRendererProps {
  readonly fields: FieldDefinition[];
  readonly content: Record<string, unknown>;
  readonly onChange: (fieldName: string, value: string | number | boolean) => void;
  readonly disabled?: boolean;
}

interface AutoGrowingTextareaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}

const AutoGrowingTextarea = ({ value, onChange, placeholder, disabled }: AutoGrowingTextareaProps) => {
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
      disabled={disabled}
    />
  );
};

export function CustomFieldRenderer({ fields, content, onChange, disabled }: Readonly<CustomFieldRendererProps>) {
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
              value={(content[field.name] as string) || ""}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(field.name, e.target.value)}
              placeholder={`Enter ${field.name.toLowerCase()}...`}
              disabled={disabled}
            />
          )}
          
          {field.type === 'NUMBER' && (
            <input 
              type="number"
              className="input-premium p-md"
              value={(content[field.name] as number) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
            />
          )}
          
          {field.type === 'DATE' && (
            <input 
              type="date"
              className="input-premium p-md"
              value={(content[field.name] as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
            />
          )}
          {field.type === 'CHECKBOX' && (
            <label className={`flex items-center ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <span className="sr-only">Enable {field.name}</span>
              <input 
                type="checkbox"
                checked={!!content[field.name]}
                onChange={() => !disabled && onChange(field.name, !content[field.name])}
                disabled={disabled}
                className="sr-only"
              />
              <div className={`toggle-track ${content[field.name] ? 'active' : ''} ${disabled ? 'opacity-50' : ''}`}>
                <motion.div 
                  animate={{ x: content[field.name] ? 20 : 0 }}
                  className="toggle-thumb"
                />
              </div>
            </label>
          )}

          {field.type === 'SELECT' && (
            <select
              className="input-premium p-md w-full appearance-none cursor-pointer"
              value={(content[field.name] as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
            >
              <option value="" disabled>Select {field.name.toLowerCase()}...</option>
              {field.options?.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          )}
        </FormField>
      ))}
    </div>
  );
}
