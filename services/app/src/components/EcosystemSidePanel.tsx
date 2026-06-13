"use client";

import React from 'react';
import { Trash2, Type, Hash, Calendar, CheckCircle2, LayoutGrid, X } from 'lucide-react';
import { IconRenderer } from './IconPicker';
import { Button } from './ui/Button';

import { NodeType } from '@/lib/types';
import { useEcosystemSidePanel } from './useEcosystemSidePanel';
import { VisualIdentitySection } from './blueprint/VisualIdentitySection';
import { LogicSection } from './blueprint/LogicSection';
import { FieldDefinitionsSection } from './blueprint/FieldDefinitionsSection';

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

  const {
    name, setName,
    isSprintEligible, setIsSprintEligible,
    fieldName, setFieldName,
    fieldType, setFieldType,
    fieldOptions, setFieldOptions,
    selectOptions, setSelectOptions,
    isAddingField, setIsAddingField,
    handleUpdateIcon,
    handleUpdateColor,
    handleUpdateName,
    handleToggleSprint,
    handleToggleVisibility,
    handleAddField,
    handleDelete,
    showOnKanban,
    showOnGantt
  } = useEcosystemSidePanel(projectId, activeNodeType, onClose, isReadOnly);

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-surface/80 backdrop-blur-md animate-in fade-in overflow-y-auto p-xl">
      <div className="card-planner p-2xl w-full max-w-4xl shadow-planner my-auto flex flex-col gap-xl">
        <div className="flex flex-row justify-between items-center mb-md">
          <div className="flex items-center gap-md">
              <div 
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" 
                style={{ backgroundColor: `${activeNodeType.color}15`, color: activeNodeType.color || undefined }}
              >
                  <IconRenderer name={activeNodeType.icon || ""} size={28} />
              </div>
              <div className="flex-1">
                   <label htmlFor="blueprint-name" className="sr-only">Blueprint Name</label>
                   <input 
                       id="blueprint-name"
                       className="text-editorial font-bold text-2xl bg-transparent border-none p-0 w-full focus:outline-none focus:ring-0" 
                       value={name} 
                       onChange={(e) => !isReadOnly && setName(e.target.value)} 
                       onBlur={handleUpdateName}
                       disabled={isReadOnly}
                   />
                  <p className="text-meta text-10px tracking-widest opacity-60">BLUEPRINT SETTINGS</p>
              </div>
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full flex items-center justify-center transition-all bg-transparent hover:bg-surface-container-high opacity-40 hover:opacity-100 p-0 border-none outline-none shrink-0 ml-md"
            style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
          >
              <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-xl">
          <VisualIdentitySection 
            activeNodeType={activeNodeType} 
            onUpdateIcon={handleUpdateIcon} 
            onUpdateColor={handleUpdateColor} 
          />

          <div className="flex flex-col gap-xl">
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
           <div className="pt-xl border-t border-outline-variant">
             <Button onClick={handleDelete} variant="ghost" size="sm" className="text-error hover:bg-error/10" icon={<Trash2 size={16} />}>
                 Destroy Blueprint Type
             </Button>
           </div>
         )}
      </div>
    </div>
  );
}
