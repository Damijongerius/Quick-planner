"use client";

import React, { FormEvent } from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';

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
    selectOptions: { value: string; color: string }[];
    setSelectOptions: React.Dispatch<React.SetStateAction<{ value: string; color: string }[]>>;
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
    onDiscard,
    selectOptions,
    setSelectOptions
}: Readonly<AddFieldDefinitionFormProps>) {
    const options = fieldTypes.map(({ type }) => ({ value: type, label: type }));

    const [newOptionVal, setNewOptionVal] = React.useState("");
    const [newOptionColor, setNewOptionColor] = React.useState("#10b981");

    const colors = [
        { name: "Green", value: "#10b981" },
        { name: "Yellow", value: "#eab308" },
        { name: "Orange", value: "#f97316" },
        { name: "Red", value: "#ef4444" },
        { name: "Blue", value: "#3b82f6" },
        { name: "Pink", value: "#ec4899" },
        { name: "Purple", value: "#a855f7" },
        { name: "Slate", value: "#64748b" }
    ];

    function handleAddOption(e?: React.MouseEvent) {
        if (e) e.preventDefault();
        const val = newOptionVal.trim();
        if (!val) return;
        if (selectOptions.some(o => o.value.toLowerCase() === val.toLowerCase())) return;
        setSelectOptions([...selectOptions, { value: val, color: newOptionColor }]);
        setNewOptionVal("");
    }

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
                <div style={{ width: '128px' }}>
                    <label htmlFor="field-type" className="sr-only">Attribute type</label>
                    <Select 
                        options={options}
                        value={fieldType}
                        onChange={setFieldType}
                        triggerClassName="h-10 text-[10px] font-bold uppercase"
                    />
                </div>
            </div>
            {fieldType === 'SELECT' && (
                <div className="flex flex-col gap-sm animate-in fade-in slide-in-from-top-1">
                    <span className="text-[10px] opacity-60 uppercase font-semibold">Select Options</span>
                    
                    {selectOptions.length > 0 && (
                        <div className="flex flex-wrap gap-xs p-sm bg-surface-container-high rounded-xl border border-outline-variant">
                            {selectOptions.map((opt) => (
                                <span 
                                    key={opt.value}
                                    className="status-pill flex items-center gap-xs"
                                    style={{
                                        fontSize: '11px',
                                        padding: '4px 10px',
                                        backgroundColor: `color-mix(in srgb, ${opt.color} 12%, transparent)`,
                                        color: opt.color,
                                        border: `1px solid color-mix(in srgb, ${opt.color} 25%, transparent)`,
                                        fontWeight: 600
                                    }}
                                >
                                    {opt.value}
                                    <button
                                        type="button"
                                        onClick={() => setSelectOptions(selectOptions.filter(o => o.value !== opt.value))}
                                        className="hover:opacity-100 opacity-60 transition-all border-none bg-transparent p-0 flex items-center justify-center text-xs ml-xs cursor-pointer"
                                        style={{ color: opt.color }}
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex flex-col gap-xs bg-surface-container-low p-sm rounded-xl border border-outline-variant">
                        <div className="flex gap-sm">
                            <input 
                                className="input-planner flex-1 h-9 text-xs px-sm" 
                                placeholder="Option name (e.g. Minutes, Hours)" 
                                value={newOptionVal} 
                                onChange={(e) => setNewOptionVal(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddOption();
                                    }
                                }}
                            />
                            <Button 
                                type="button" 
                                onClick={(e) => handleAddOption(e)}
                                size="sm" 
                                variant="secondary"
                                className="h-9 px-md text-xs"
                            >
                                Add Option
                            </Button>
                        </div>

                        <div className="flex items-center justify-between mt-xs px-xs">
                            <span className="text-[10px] opacity-50">Choose Chip Color:</span>
                            <div className="flex gap-xs">
                                {colors.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); setNewOptionColor(c.value); }}
                                        className="w-5 h-5 rounded-full border-none transition-all flex items-center justify-center cursor-pointer hover:scale-110 relative"
                                        style={{ 
                                            backgroundColor: c.value,
                                            opacity: newOptionColor === c.value ? 1 : 0.4
                                        }}
                                        title={c.name}
                                    >
                                        {newOptionColor === c.value && (
                                            <span style={{ color: 'white', fontSize: '10px', fontWeight: 'bold' }}>✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {selectOptions.length === 0 && (
                        <div>
                            <input 
                                className="input-planner w-full h-9 text-xs px-sm opacity-60" 
                                placeholder="Or enter as comma-separated (e.g. Low, Medium, High)" 
                                value={fieldOptions} 
                                onChange={(e) => setFieldOptions(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            )}
            <div className="flex gap-sm">
                <Button type="submit" size="sm" className="flex-1 h-9">Initialize Attribute</Button>
                <Button type="button" variant="ghost" size="sm" onClick={onDiscard} className="h-9">Discard</Button>
            </div>
        </form>
    );
}
