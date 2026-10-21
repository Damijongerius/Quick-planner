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
    selectOptions: { value: string; color: string }[];
    setSelectOptions: React.Dispatch<React.SetStateAction<{ value: string; color: string }[]>>;
}

export function FieldDefinitionsSection({
    projectId, activeNodeType, isAddingField, fieldName, fieldType, fieldOptions,
    setIsAddingField, setFieldName, setFieldType, setFieldOptions, onAddField, fieldTypes,
    isReadOnly, selectOptions, setSelectOptions,
}: Readonly<FieldDefinitionsSectionProps>) {
    const fields = activeNodeType.fields ?? [];
    return (
        <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Fields <span className="font-normal text-faint">{fields.length}</span></h3>
                {!isAddingField && !isReadOnly && (
                    <Button onClick={() => setIsAddingField(true)} variant="ghost" size="sm" icon={<Plus size={12} />}>Add field</Button>
                )}
            </div>

            <div className="flex flex-col rounded-lg border border-border bg-bg">
                {isAddingField && (
                    <div className="border-b border-border p-3">
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
                            selectOptions={selectOptions}
                            setSelectOptions={setSelectOptions}
                        />
                    </div>
                )}

                {fields.map((f) => (
                    <FieldDefinitionItem key={f.id} field={f} projectId={projectId} isReadOnly={isReadOnly} fieldTypes={fieldTypes} />
                ))}
                {fields.length === 0 && !isAddingField && (
                    <p className="px-3 py-6 text-center text-sm text-faint">No custom fields yet. Fields add extra data like Priority or Points to items of this type.</p>
                )}
            </div>
        </section>
    );
}
