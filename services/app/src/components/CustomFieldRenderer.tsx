"use client";

import React from "react";
import { FormField } from "./ui/FormField";
import { AutoGrowingTextarea } from "./ui/AutoGrowingTextarea";
import { Select } from "./ui/Select";
import { Input } from "./ui/Input";
import { Checkbox } from "./ui/Checkbox";
import { getOptionColor } from "@/lib/utils/colorUtils";

import { FieldDefinition } from "@/lib/types";

interface CustomFieldRendererProps {
  readonly fields: FieldDefinition[];
  readonly content: Record<string, unknown>;
  readonly onChange: (fieldName: string, value: string | number | boolean) => void;
  readonly disabled?: boolean;
}

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
            <Input 
              type="number"
              variant="premium"
              value={(content[field.name] as number) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
            />
          )}
          
          {field.type === 'DATE' && (
            <Input 
              type="date"
              variant="premium"
              value={(content[field.name] as string) || ""}
              onChange={(e) => onChange(field.name, e.target.value)}
              disabled={disabled}
            />
          )}

          {field.type === 'CHECKBOX' && (
            <Checkbox
              checked={!!content[field.name]}
              onChange={() => !disabled && onChange(field.name, !content[field.name])}
              disabled={disabled}
              label={`Enable ${field.name.toLowerCase()}`}
            />
          )}

          {field.type?.toUpperCase() === 'SELECT' && (
            <Select
              options={Array.isArray(field.options) ? field.options.map((opt: any) => {
                const isObj = typeof opt !== 'string' && opt !== null && typeof opt === 'object';
                const val = isObj ? opt.value : String(opt);
                const color = isObj && opt.color ? opt.color : getOptionColor(val);
                return { value: val, label: val, color };
              }) : []}
              value={(content[field.name] as string) || ""}
              onChange={(val) => onChange(field.name, val)}
              placeholder={`Select ${field.name.toLowerCase()}...`}
              disabled={disabled}
            />
          )}
        </FormField>
      ))}
    </div>
  );
}
