"use client";

import { Trash2, Type, LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { removeFieldDefinition } from '@/lib/actions';

interface FieldDefinition {
    id: string;
    name: string;
    type: string;
    options?: any[] | null;
}

interface FieldDefinitionItemProps {
    field: FieldDefinition;
    projectId: string;
    isReadOnly?: boolean;
    fieldTypes: { type: string; icon: LucideIcon }[];
}

export function FieldDefinitionItem({
    field,
    projectId,
    isReadOnly,
    fieldTypes,
}: Readonly<FieldDefinitionItemProps>) {
    const Icon = fieldTypes.find((t) => t.type === field.type)?.icon || Type;
    return (
        <div className="flex items-center justify-between group py-sm border-b border-outline-variant/30 last:border-0">
            <div className="flex items-start gap-md">
                <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0 mt-xs">
                    <Icon size={16} />
                </div>
                <div className="flex flex-col">
                    <div className="flex items-center gap-sm">
                        <span className="text-sm font-bold text-on-surface">{field.name}</span>
                    </div>
                    {field.type === 'SELECT' && field.options && field.options.length > 0 && (
                        <div className="flex items-center gap-xs mt-sm flex-wrap">
                            {field.options.map((opt: any, i) => {
                                const val = typeof opt === 'string' ? opt : opt.value;
                                const color = typeof opt === 'string' ? undefined : opt.color;
                                return (
                                    <span
                                        key={i}
                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs"
                                        style={color ? {
                                            backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
                                            color: color,
                                            border: `1px solid color-mix(in srgb, ${color} 25%, transparent)`,
                                            fontWeight: 400
                                        } : {
                                            backgroundColor: 'var(--surface-container-high)',
                                            color: 'var(--on-surface-variant)',
                                            border: '1px solid var(--outline-variant)',
                                            fontWeight: 400
                                        }}
                                    >
                                        {val}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            {!isReadOnly && (
                <Button
                    variant="ghost"
                    onClick={async () => {
                        await removeFieldDefinition(projectId, field.id);
                        window.dispatchEvent(new CustomEvent("project-mutated"));
                    }}
                    className="opacity-0 group-hover:opacity-100 p-xs text-error hover:bg-error/10 rounded-md transition-all"
                >
                    <Trash2 size={14} />
                </Button>
            )}
        </div>
    );
}
