"use client";

import { Trash2, Type, LucideIcon } from 'lucide-react';
import { Button } from '../ui/Button';
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
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-sm">
                <Icon size={14} className="opacity-40" />
                <span className="text-xs font-bold">{field.name}</span>
                <span className="text-[9px] opacity-30 uppercase font-mono">{field.type}</span>
                {field.type === 'SELECT' && field.options && field.options.length > 0 && (
                    <span className="text-[9px] opacity-50 italic">
                        ({field.options.map((opt: any) => typeof opt === 'string' ? opt : opt.value).join(', ')})
                    </span>
                )}
            </div>
             {!isReadOnly && (
                <Button 
                    variant="ghost"
                    onClick={() => removeFieldDefinition(projectId, field.id)}
                    className="opacity-0 group-hover:opacity-100 p-xs text-error hover:bg-error/10 rounded-md transition-all"
                >
                    <Trash2 size={14} />
                </Button>
            )}
        </div>
    );
}
