"use client";

import { Trash2, Type, LucideIcon } from 'lucide-react';
import { removeFieldDefinition } from '@/lib/actions';

interface FieldDefinition {
    id: string;
    name: string;
    type: string;
    options?: unknown[] | null;
}

interface FieldDefinitionItemProps {
    field: FieldDefinition;
    projectId: string;
    isReadOnly?: boolean;
    fieldTypes: { type: string; icon: LucideIcon }[];
}

const TYPE_LABEL: Record<string, string> = { TEXT: "Text", NUMBER: "Number", DATE: "Date", CHECKBOX: "Checkbox", SELECT: "Select" };

export function FieldDefinitionItem({ field, projectId, isReadOnly, fieldTypes }: Readonly<FieldDefinitionItemProps>) {
    const Icon = fieldTypes.find((t) => t.type === field.type)?.icon || Type;
    return (
        <div className="group flex items-start gap-3 border-b border-border px-3 py-2.5 last:border-b-0">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-hover text-muted"><Icon size={14} /></span>
            <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2 text-sm font-medium">{field.name} <span className="text-xs font-normal text-faint">{TYPE_LABEL[field.type] ?? field.type}</span></p>
                {field.type === 'SELECT' && field.options && field.options.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1">
                        {field.options.map((opt, i) => {
                            const val = typeof opt === 'string' ? opt : (opt as { value: string }).value;
                            const color = typeof opt === 'string' ? undefined : (opt as { color?: string }).color;
                            return (
                                <span key={i} className="rounded-full px-2 py-0.5 text-xs" style={color ? { color, background: `color-mix(in srgb, ${color} 14%, transparent)` } : { color: 'var(--muted)', background: 'var(--hover)' }}>
                                    {val}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
            {!isReadOnly && (
                <button
                    onClick={async () => { if (confirm(`Remove the “${field.name}” field? Values already entered on items are kept but hidden.`)) await removeFieldDefinition(projectId, field.id); }}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-faint opacity-0 transition-opacity hover:bg-danger-soft hover:text-danger group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Remove field ${field.name}`}
                >
                    <Trash2 size={14} />
                </button>
            )}
        </div>
    );
}
