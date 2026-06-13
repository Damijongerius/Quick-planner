import { useState, useEffect } from 'react';
import { updateNodeType, deleteNodeType, updateNodeTypeBoardConfig, addFieldDefinition } from '@/lib/actions';
import { NodeType } from '@/lib/types';
import { getOptionColor } from '@/lib/utils/colorUtils';

export function useEcosystemSidePanel(projectId: string, activeNodeType: NodeType, onClose: () => void, isReadOnly?: boolean) {
  const [name, setName] = useState(activeNodeType.name);
  const [isSprintEligible, setIsSprintEligible] = useState(activeNodeType.isSprintEligible);
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [fieldOptions, setFieldOptions] = useState("");
  const [selectOptions, setSelectOptions] = useState<{ value: string; color: string }[]>([]);
  const [isAddingField, setIsAddingField] = useState(false);

  const [prevNodeTypeId, setPrevNodeTypeId] = useState(activeNodeType.id);

  if (activeNodeType.id !== prevNodeTypeId) {
    setPrevNodeTypeId(activeNodeType.id);
    setName(activeNodeType.name);
    setIsSprintEligible(activeNodeType.isSprintEligible);
  }
  
  const handleUpdateIcon = async (icon: string) => {
    if (isReadOnly) return;
    await updateNodeType(projectId, activeNodeType.id, activeNodeType.name || "", activeNodeType.color || "#000", icon, isSprintEligible);
    window.dispatchEvent(new CustomEvent("project-mutated"));
  };

  const handleUpdateColor = async (color: string) => {
    if (isReadOnly) return;
    await updateNodeType(projectId, activeNodeType.id, name || "", color, activeNodeType.icon || "", isSprintEligible);
    window.dispatchEvent(new CustomEvent("project-mutated"));
  };

  const handleUpdateName = async () => {
    if (isReadOnly || name === activeNodeType.name) return;
    await updateNodeType(projectId, activeNodeType.id, name || "", activeNodeType.color || "#000", activeNodeType.icon || "", isSprintEligible);
    window.dispatchEvent(new CustomEvent("project-mutated"));
  };

  const handleToggleSprint = async () => {
    if (isReadOnly) return;
    const newVal = !isSprintEligible;
    setIsSprintEligible(newVal);
    const currentConfig = (activeNodeType.boardConfig as any) || {};
    await updateNodeTypeBoardConfig(projectId, activeNodeType.id, {
      ...currentConfig,
      isSprintEligible: newVal
    });
    window.dispatchEvent(new CustomEvent("project-mutated"));
  };

  const handleToggleVisibility = async (key: 'showOnKanban' | 'showOnGantt') => {
    if (isReadOnly) return;
    const currentConfig = (activeNodeType.boardConfig as any) || {};
    const newVal = currentConfig[key] === false;
    await updateNodeTypeBoardConfig(projectId, activeNodeType.id, {
      ...currentConfig,
      [key]: newVal,
      isSprintEligible
    });
    window.dispatchEvent(new CustomEvent("project-mutated"));
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

    await addFieldDefinition(projectId, activeNodeType.id, fieldName, fieldType, optionsArray);
    window.dispatchEvent(new CustomEvent("project-mutated"));
    setFieldName("");
    setFieldOptions("");
    setSelectOptions([]);
    setIsAddingField(false);
  };

  const handleDelete = async () => {
    if (isReadOnly) return;
    if(confirm(`Are you sure you want to delete the ${activeNodeType.name} blueprint? This cannot be undone.`)) {
        await deleteNodeType(projectId, activeNodeType.id);
        window.dispatchEvent(new CustomEvent("project-mutated"));
        onClose();
    }
  };

  const boardConfig = activeNodeType.boardConfig || {};
  const showOnKanban = boardConfig.showOnKanban !== false;
  const showOnGantt = boardConfig.showOnGantt !== false;

  return {
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
  };
}
