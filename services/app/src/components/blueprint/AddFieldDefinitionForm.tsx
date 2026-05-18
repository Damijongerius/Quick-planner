"use client";

import type { FormEvent } from 'react';
import { Plus, LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';

interface AddFieldDefinitionFormProps {
    fieldName: string;
    fieldType: string;
    fieldOptions: string;
    setFieldName: (val: string) => void;
    setFieldType: (val: string) => void;
    setFieldOptions: (val: string) => void;
    onAddField: (e: FormEvent<HTMLFormElement>) => Promise<void>;
    fieldTypes: { type: string; icon: LucideIcon }[];
    onDiscard: () => void;
}

export function AddFieldDefinitionForm({
    fieldName,
    fieldType,
    fieldOptions,
    setFieldName,
    setFieldType,
    setFieldOptions,
    onAddField,
    fieldTypes,
    onDiscard
}: Readonly<AddFieldDefinitionFormProps>) {
    return (
        <form onSubmit={onAddField} className="flex flex-col gap-sm pb-md border-b border-outline-variant mb-sm animate-in fade-in slide-in-from-top-2">
            <div className="flex gap-sm">
                <div className="flex-1">
                    <label htmlFor="field-name" className="sr-only">Attribute name</label>
                    <input 
                        id="field-name"
                        autoFocus 
                        className="input-planner w-full h-10 text-sm px-md" 
                        placeholder="Attribute name (e.g. ROI, Priority)" 
                        value={fieldName} 
                        onChange={(e) => setFieldName(e.target.value)}
                        required 
                    />
                </div>
                <div className="relative w-32">
                    <label htmlFor="field-type" className="sr-only">Attribute type</label>
                    <select 
                        id="field-type"
                        className="input-planner w-full h-10 text-[10px] font-bold uppercase appearance-none cursor-pointer px-md pr-xl bg-surface-container-high"
                        value={fieldType}
                        onChange={(e) => setFieldType(e.target.value)}
                    >
                        {fieldTypes.map(({ type }) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <div className="absolute right-md top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                        <Plus size={12} className="rotate-45" />
                    </div>
                </div>
            </div>
            {fieldType === 'SELECT' && (
                <div className="animate-in fade-in slide-in-from-top-1">
                    <label htmlFor="field-options" className="sr-only">Comma-separated options</label>
                    <input 
                        id="field-options"
                        className="input-planner w-full h-10 text-sm px-md" 
                        placeholder="Comma-separated options (e.g. Low, Medium, High)" 
                        value={fieldOptions} 
                        onChange={(e) => setFieldOptions(e.target.value)}
                        required 
                    />
                    <p className="text-[9px] opacity-40 mt-xs ml-xs">Users will choose from these values in a dropdown menu.</p>
                </div>
            )}
            <div className="flex gap-sm">
                <Button type="submit" size="sm" className="flex-1 h-9">Initialize Attribute</Button>
                <Button type="button" variant="ghost" size="sm" onClick={onDiscard} className="h-9">Discard</Button>
            </div>
        </form>
    );
}
