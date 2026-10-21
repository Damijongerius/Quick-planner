"use client";

import React from 'react';
import { Trash2, Type, Hash, Calendar, CheckCircle2, X, LayoutGrid } from 'lucide-react';
import { IconRenderer } from './IconPicker';
import { Button } from './ui/Button';
import { updateNodeType, deleteNodeType, updateNodeTypeBoardConfig, addFieldDefinition } from '@/lib/actions';

import { NodeType, BoardConfig } from '@/lib/types';

import { VisualIdentitySection } from './blueprint/VisualIdentitySection';
import { LogicSection } from './blueprint/LogicSection';
import { FieldDefinitionsSection } from './blueprint/FieldDefinitionsSection';
import { getOptionColor } from '@/lib/utils/colorUtils';

const FIELD_TYPES = [
    { type: "TEXT", icon: Type },
    { type: "NUMBER", icon: Hash },
    { type: "DATE", icon: Calendar },
    { type: "CHECKBOX", icon: CheckCircle2 },
    { type: "SELECT", icon: LayoutGrid }
];

interface EcosystemSidePanelProps {
  projectId: string;
  activeNodeType: NodeType;
  onClose: () => void;
  isReadOnly?: boolean;
}

export function EcosystemSidePanel({ 
  projectId, 
  activeNodeType, 
  onClose,
  isReadOnly
}: Readonly<EcosystemSidePanelProps>) {
  const [name, setName] = React.useState(activeNodeType.name);
  const [isSprintEligible, setIsSprintEligible] = React.useState(activeNodeType.isSprintEligible);
  const [fieldName, setFieldName] = React.useState("");
  const [fieldType, setFieldType] = React.useState("TEXT");
  const [fieldOptions, setFieldOptions] = React.useState("");
  const [selectOptions, setSelectOptions] = React.useState<{ value: string; color: string }[]>([]);
  const [isAddingField, setIsAddingField] = React.useState(false);

  const [prevNodeTypeId, setPrevNodeTypeId] = React.useState(activeNodeType.id);

  if (activeNodeType.id !== prevNodeTypeId) {
    setPrevNodeTypeId(activeNodeType.id);
    setName(activeNodeType.name);
    setIsSprintEligible(activeNodeType.isSprintEligible);
  }
  
   const handleUpdateIcon = async (icon: string) => {
     if (isReadOnly) return;
     await updateNodeType(projectId, activeNodeType.id, activeNodeType.name || "", activeNodeType.color || "#000", icon, isSprintEligible);
   };

   const handleUpdateColor = async (color: string) => {
     if (isReadOnly) return;
     await updateNodeType(projectId, activeNodeType.id, name || "", color, activeNodeType.icon || "", isSprintEligible);
   };

   const handleUpdateName = async () => {
     if (isReadOnly || name === activeNodeType.name) return;
     await updateNodeType(projectId, activeNodeType.id, name || "", activeNodeType.color || "#000", activeNodeType.icon || "", isSprintEligible);
   };

   const handleToggleSprint = async () => {
     if (isReadOnly) return;
     const newVal = !isSprintEligible;
     setIsSprintEligible(newVal);
     const currentConfig = (activeNodeType.boardConfig as BoardConfig | null | undefined) || {};
     await updateNodeTypeBoardConfig(projectId, activeNodeType.id, {
       ...currentConfig,
       isSprintEligible: newVal
     });
   };

   const handleToggleVisibility = async (key: 'showOnKanban' | 'showOnGantt') => {
     if (isReadOnly) return;
     const currentConfig = (activeNodeType.boardConfig as BoardConfig | null | undefined) || {};
     const newVal = currentConfig[key] === false;
     await updateNodeTypeBoardConfig(projectId, activeNodeType.id, {
       ...currentConfig,
       [key]: newVal,
       isSprintEligible
     });
   };

   const handleAddField = async (e: React.FormEvent<HTMLFormElement>) => {
     e.preventDefault();
     if (isReadOnly || !fieldName) return;

     if (fieldType === 'SELECT' && selectOptions.length === 0 && !fieldOptions.trim()) {
       alert("Please add at least one select option.");
       return;
     }

     const optionsArray = fieldType === 'SELECT' 
       ? selectOptions.length > 0 
         ? selectOptions 
         : fieldOptions.split(',').map(o => o.trim()).filter(o => o !== "").map(o => ({ value: o, color: getOptionColor(o) }))
       : undefined;

     const result = await addFieldDefinition(projectId, activeNodeType.id, fieldName, fieldType, optionsArray);
     if (result?.error) {
       alert(result.error);
       return;
     }
     setFieldName("");
     setFieldType("TEXT");
     setFieldOptions("");
     setSelectOptions([]);
     setIsAddingField(false);
   };

   const handleDelete = async () => {
     if (isReadOnly) return;
     if(confirm(`Delete the “${activeNodeType.name}” item type? This can't be undone.`)) {
         const result = await deleteNodeType(projectId, activeNodeType.id);
         if (result?.error) {
           alert(result.error);
           return;
         }
         onClose();
     }
   };

  const boardConfig = activeNodeType.boardConfig || {};
  const showOnKanban = boardConfig.showOnKanban !== false;
  const showOnGantt = boardConfig.showOnGantt !== false;

  const colorVar = activeNodeType.color || "var(--accent)";

  return (
    <div className="modal-overlay" onClick={onClose} role="none">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${activeNodeType.name} settings`}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-border bg-panel shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 border-b border-border px-5 py-3.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ color: colorVar, background: `color-mix(in srgb, ${colorVar} 14%, transparent)` }}>
            <IconRenderer name={activeNodeType.icon || ""} size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor="blueprint-name" className="sr-only">Type name</label>
            <input
              id="blueprint-name"
              className="input-seamless !text-lg"
              value={name}
              onChange={(e) => !isReadOnly && setName(e.target.value)}
              onBlur={handleUpdateName}
              disabled={isReadOnly}
              maxLength={120}
            />
            <p className="text-xs text-muted">Item type settings</p>
          </div>
          <button onClick={onClose} className="icon-button" aria-label="Close"><X size={18} /></button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto p-5 md:grid-cols-2">
          <VisualIdentitySection
            activeNodeType={activeNodeType}
            onUpdateIcon={handleUpdateIcon}
            onUpdateColor={handleUpdateColor}
            isReadOnly={isReadOnly}
          />

          <div className="flex flex-col gap-6">
            <LogicSection
              isSprintEligible={isSprintEligible}
              showOnKanban={showOnKanban}
              showOnGantt={showOnGantt}
              onToggleSprint={handleToggleSprint}
              onToggleVisibility={handleToggleVisibility}
              isReadOnly={isReadOnly}
            />

            <FieldDefinitionsSection
              projectId={projectId}
              activeNodeType={activeNodeType}
              isAddingField={isAddingField}
              fieldName={fieldName}
              fieldType={fieldType}
              fieldOptions={fieldOptions}
              setIsAddingField={setIsAddingField}
              setFieldName={setFieldName}
              setFieldType={setFieldType}
              setFieldOptions={setFieldOptions}
              onAddField={handleAddField}
              fieldTypes={FIELD_TYPES}
              isReadOnly={isReadOnly}
              selectOptions={selectOptions}
              setSelectOptions={setSelectOptions}
            />
          </div>
        </div>

        {!isReadOnly && (
          <footer className="border-t border-border bg-sidebar px-5 py-3">
            <Button onClick={handleDelete} variant="ghost" size="sm" className="hover:!text-danger" icon={<Trash2 size={14} />}>
              Delete item type
            </Button>
          </footer>
        )}
      </div>
    </div>
  );
}
