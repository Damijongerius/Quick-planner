"use client";

import React, { FormEvent } from 'react';
import { LucideIcon, X } from 'lucide-react';
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

const TYPE_LABEL: Record<string, string> = { TEXT: "Text", NUMBER: "Number", DATE: "Date", CHECKBOX: "Checkbox", SELECT: "Select" };

const COLORS = [
    { name: "Green", value: "#10b981" },
    { name: "Yellow", value: "#eab308" },
    { name: "Orange", value: "#f97316" },
    { name: "Red", value: "#ef4444" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Pink", value: "#ec4899" },
    { name: "Purple", value: "#a855f7" },
    { name: "Slate", value: "#64748b" },
];

export function AddFieldDefinitionForm({
    fieldName, fieldType, fieldOptions, setFieldName, setFieldType, setFieldOptions,
    onAddField, fieldTypes, onDiscard, selectOptions, setSelectOptions,
}: Readonly<AddFieldDefinitionFormProps>) {
    const typeOptions = fieldTypes.map(({ type }) => ({ value: type, label: TYPE_LABEL[type] ?? type }));
    const [newOptionVal, setNewOptionVal] = React.useState("");
    const [newOptionColor, setNewOptionColor] = React.useState(COLORS[0].value);

    function handleAddOption(e?: React.MouseEvent) {
        e?.preventDefault();
        const val = newOptionVal.trim();
        if (!val) return;
        if (selectOptions.some(o => o.value.toLowerCase() === val.toLowerCase())) return;
        setSelectOptions([...selectOptions, { value: val, color: newOptionColor }]);
        setNewOptionVal("");
    }

    return (
        <form onSubmit={onAddField} className="flex flex-col gap-3 animate-fade-in">
            <div className="flex gap-2">
                <div className="flex-1">
                    <label htmlFor="field-name" className="sr-only">Field name</label>
                    <input id="field-name" autoFocus className="input-planner" placeholder="Field name, e.g. Priority" value={fieldName} onChange={(e) => setFieldName(e.target.value)} maxLength={120} required />
                </div>
                <div className="w-32"><Select options={typeOptions} value={fieldType} onChange={setFieldType} /></div>
            </div>

            {fieldType === 'SELECT' && (
                <div className="flex flex-col gap-2 rounded-md border border-border bg-panel p-2.5">
                    <span className="text-xs font-medium text-muted">Options</span>

                    {selectOptions.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {selectOptions.map((opt) => (
                                <span key={opt.value} className="inline-flex items-center gap-1 rounded-full py-0.5 pl-2 pr-1 text-xs font-medium" style={{ color: opt.color, background: `color-mix(in srgb, ${opt.color} 14%, transparent)` }}>
                                    {opt.value}
                                    <button type="button" aria-label={`Remove ${opt.value}`} onClick={() => setSelectOptions(selectOptions.filter(o => o.value !== opt.value))} className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10">
                                        <X size={11} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2">
                        <input
                            className="input-planner flex-1"
                            placeholder="Add an option…"
                            value={newOptionVal}
                            onChange={(e) => setNewOptionVal(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddOption(); } }}
                        />
                        <Button type="button" variant="secondary" onClick={(e) => handleAddOption(e)}>Add</Button>
                    </div>

                    <div className="flex items-center gap-1.5">
                        <span className="mr-1 text-xs text-muted">Colour</span>
                        {COLORS.map((c) => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setNewOptionColor(c.value)}
                                title={c.name}
                                aria-label={c.name}
                                aria-pressed={newOptionColor === c.value}
                                className={`h-5 w-5 rounded-full transition-transform hover:scale-110 ${newOptionColor === c.value ? "ring-2 ring-offset-1 ring-offset-panel" : "opacity-60"}`}
                                style={{ background: c.value, ["--tw-ring-color" as string]: c.value }}
                            />
                        ))}
                    </div>

                    {selectOptions.length === 0 && (
                        <input className="input-planner" placeholder="Or paste comma-separated: Low, Medium, High" value={fieldOptions} onChange={(e) => setFieldOptions(e.target.value)} />
                    )}
                </div>
            )}

            <div className="flex gap-2">
                <Button type="submit" size="sm">Add field</Button>
                <Button type="button" variant="ghost" size="sm" onClick={onDiscard}>Cancel</Button>
            </div>
        </form>
    );
}
