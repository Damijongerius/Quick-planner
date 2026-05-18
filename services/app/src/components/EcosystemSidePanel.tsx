"use client";

import React from 'react';
import { Trash2, Type, Hash, Calendar, CheckCircle2, X, LayoutGrid } from 'lucide-react';
import { IconRenderer } from './IconPicker';
import { Button } from './ui/Button';
import { updateNodeType, deleteNodeType, updateNodeTypeBoardConfig, addFieldDefinition } from '@/lib/actions';

import { NodeType } from '@/lib/types';

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
  const [name, setName] = React.useState(activeNodeType.name);
  const [isSprintEligible, setIsSprintEligible] = React.useState(activeNodeType.isSprintEligible);
  const [fieldName, setFieldName] = React.useState("");
  const [fieldType, setFieldType] = React.useState("TEXT");
  const [fieldOptions, setFieldOptions] = React.useState("");
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
     const currentConfig = activeNodeType.boardConfig || {};
     await updateNodeTypeBoardConfig(projectId, activeNodeType.id, {
       ...currentConfig,
       isSprintEligible: newVal
     });
   };

   const handleToggleVisibility = async (key: 'showOnKanban' | 'showOnGantt') => {
     if (isReadOnly) return;
     const currentConfig = activeNodeType.boardConfig || {};
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
     const optionsArray = fieldType === 'SELECT' 
       ? fieldOptions.split(',').map(o => o.trim()).filter(o => o !== "")
       : undefined;
     await addFieldDefinition(projectId, activeNodeType.id, fieldName, fieldType, optionsArray);
     setFieldName("");
     setFieldOptions("");
     setIsAddingField(false);
   };

   const handleDelete = async () => {
     if (isReadOnly) return;
     if(confirm(`Are you sure you want to delete the ${activeNodeType.name} blueprint? This cannot be undone.`)) {
         await deleteNodeType(projectId, activeNodeType.id);
         onClose();
     }
   };

  const boardConfig = activeNodeType.boardConfig || {};
  const showOnKanban = boardConfig.showOnKanban !== false;
  const showOnGantt = boardConfig.showOnGantt !== false;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-surface/80 backdrop-blur-md animate-in fade-in overflow-y-auto p-xl">
      <div className="card-planner p-2xl w-full max-w-4xl shadow-planner my-auto flex flex-col gap-xl">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-md">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-container-high shadow-sm" style={{ color: activeNodeType.color || undefined }}>
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
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all bg-transparent hover:bg-surface-container-high opacity-40 hover:opacity-100 p-0 border-none outline-none shrink-0 self-start"
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
