"use client";

import React from 'react';
import { Plus, Trash2, Type } from 'lucide-react';
import { Button } from '../ui/Button';
import { removeFieldDefinition } from '@/lib/actions';
import { NodeType } from '@/lib/types';

interface FieldDefinitionsSectionProps {
    projectId: string;
    activeNodeType: NodeType;
    isAddingField: boolean;
    fieldName: string;
    fieldType: string;
    setIsAddingField: (val: boolean) => void;
    setFieldName: (val: string) => void;
    setFieldType: (val: string) => void;
    onAddField: (e: React.FormEvent) => Promise<void>;
    fieldTypes: any[];
}

export function FieldDefinitionsSection({ 
    projectId,
    activeNodeType,
    isAddingField,
    fieldName,
    fieldType,
    setIsAddingField,
    setFieldName,
    setFieldType,
    onAddField,
    fieldTypes
}: FieldDefinitionsSectionProps) {
    return (
        <section className="flex flex-col gap-md">
            <div className="flex justify-between items-center">
                <label className="text-meta text-10px opacity-60 uppercase">Field Definitions</label>
                {!isAddingField && (
                    <Button onClick={() => setIsAddingField(true)} variant="ghost" size="sm" icon={<Plus size={12} />} className="h-6 text-[10px] px-sm">
                        Add Attribute
                    </Button>
                )}
            </div>
            
                <div className="bg-surface-container-low p-lg rounded-2xl border border-outline-variant flex flex-col gap-md">
                    {isAddingField && (
                        <form onSubmit={onAddField} className="flex flex-col gap-sm pb-md border-b border-outline-variant mb-sm animate-in fade-in slide-in-from-top-2">
                            <div className="flex gap-sm">
                                <input 
                                    autoFocus 
                                    className="input-planner flex-1 h-10 text-sm px-md" 
                                    placeholder="Attribute name (e.g. ROI, Priority)" 
                                    value={fieldName} 
                                    onChange={(e) => setFieldName(e.target.value)}
                                    required 
                                />
                                <div className="relative w-32">
                                    <select 
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
                            <div className="flex gap-sm">
                                <Button type="submit" size="sm" className="flex-1 h-9">Initialize Attribute</Button>
                                <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingField(false)} className="h-9">Discard</Button>
                            </div>
                        </form>
                    )}

                <div className="flex flex-col gap-xs">
                    {activeNodeType.fields?.map((f) => {
                        const Icon = fieldTypes.find((t) => t.type === f.type)?.icon || Type;
                        return (
                            <div key={f.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-sm">
                                    <Icon size={14} className="opacity-40" />
                                    <span className="text-xs font-bold">{f.name}</span>
                                    <span className="text-[9px] opacity-30 uppercase font-mono">{f.type}</span>
                                </div>
                                <button 
                                    onClick={() => removeFieldDefinition(projectId, f.id)}
                                    className="opacity-0 group-hover:opacity-100 p-xs text-error hover:bg-error/10 rounded-md transition-all"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        );
                    })}
                    {activeNodeType.fields?.length === 0 && !isAddingField && (
                        <p className="text-xs italic opacity-40 py-sm">No custom properties defined</p>
                    )}
                </div>
            </div>
        </section>
    );
}
