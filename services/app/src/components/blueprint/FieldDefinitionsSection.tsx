"use client";

import { LucideIcon, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { NodeType } from '@/lib/types';
import { AddFieldDefinitionForm } from './AddFieldDefinitionForm';
import { FieldDefinitionItem } from './FieldDefinitionItem';
import type { FormEvent } from 'react';

interface FieldDefinitionsSectionProps {
    projectId: string;
    activeNodeType: NodeType;
    isAddingField: boolean;
    fieldName: string;
    fieldType: string;
    fieldOptions: string;
    setIsAddingField: (val: boolean) => void;
    setFieldName: (val: string) => void;
    setFieldType: (val: string) => void;
    setFieldOptions: (val: string) => void;
    onAddField: (e: FormEvent<HTMLFormElement>) => Promise<void>;
    fieldTypes: { type: string; icon: LucideIcon }[];
    isReadOnly?: boolean;
}

export function FieldDefinitionsSection({ 
    projectId,
    activeNodeType,
    isAddingField,
    fieldName,
    fieldType,
    fieldOptions,
    setIsAddingField,
    setFieldName,
    setFieldType,
    setFieldOptions,
    onAddField,
    fieldTypes,
    isReadOnly
}: Readonly<FieldDefinitionsSectionProps>) {
    return (
        <section className="flex flex-col gap-md">
            <div className="flex justify-between items-center">
                <span className="text-meta text-10px opacity-60 uppercase">Field Definitions</span>
                {!isAddingField && !isReadOnly && (
                    <Button onClick={() => setIsAddingField(true)} variant="ghost" size="sm" icon={<Plus size={12} />} className="h-6 text-[10px] px-sm">
                        Add Attribute
                    </Button>
                )}
            </div>
            
            <div className="bg-surface-container-low p-lg rounded-2xl border border-outline-variant flex flex-col gap-md">
                {isAddingField && (
                    <AddFieldDefinitionForm
                        fieldName={fieldName}
                        fieldType={fieldType}
                        fieldOptions={fieldOptions}
                        setFieldName={setFieldName}
                        setFieldType={setFieldType}
                        setFieldOptions={setFieldOptions}
                        onAddField={onAddField}
                        fieldTypes={fieldTypes}
                        onDiscard={() => setIsAddingField(false)}
                    />
                )}

                <div className="flex flex-col gap-xs">
                    {activeNodeType.fields?.map((f) => (
                        <FieldDefinitionItem
                            key={f.id}
                            field={f}
                            projectId={projectId}
                            isReadOnly={isReadOnly}
                            fieldTypes={fieldTypes}
                        />
                    ))}
                    {activeNodeType.fields?.length === 0 && !isAddingField && (
                        <p className="text-xs italic opacity-40 py-sm">No custom properties defined</p>
                    )}
                </div>
            </div>
        </section>
    );
}

