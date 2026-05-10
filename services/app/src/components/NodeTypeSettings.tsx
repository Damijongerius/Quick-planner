"use client";

import { useState } from "react";
import { Plus, Braces, Trash2, LayoutGrid, FileJson } from "lucide-react";
import { createNodeType, deleteNodeType, getRelations } from "@/lib/actions";
import { IconPicker, IconRenderer } from "./IconPicker";
import { PremiumColorPicker } from "./PremiumColorPicker";
import { FieldEditor } from "./FieldEditor";
import { BoardConfigEditor } from "./BoardConfigEditor";
import { AIImportModal } from "./ai/AIImportModal";
import { useEffect } from "react";
import { Button } from "./ui/Button";

interface NodeTypeSettingsProps {
  projectId: string;
  initialNodeTypes: any[];
}

export function NodeTypeSettings({ projectId, initialNodeTypes }: NodeTypeSettingsProps) {
  const [activeNodeType, setActiveNodeType] = useState<any>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Create New Type state
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [newIcon, setNewIcon] = useState("Target");

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [relations, setRelations] = useState<any[]>([]);

  useEffect(() => {
    getRelations(projectId).then(setRelations);
  }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newName);
    formData.append("color", newColor);
    formData.append("icon", newIcon);
    await createNodeType(projectId, formData);
    setNewName("");
    setIsCreating(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-xl">
        <div>
            <h2 className="text-editorial text-2xl font-bold">Node Ecosystem</h2>
            <p className="text-meta text-xs mt-xs">Define types and allowed relations</p>
        </div>
        <Button 
            onClick={() => setIsAIModalOpen(true)}
            size="sm"
            icon={<FileJson size={18} />}
        >
            AI ARCHITECT
        </Button>
      </div>

      <AIImportModal 
        projectId={projectId}
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        mode="NODE_TYPES"
        context={{ 
            nodeTypes: initialNodeTypes.map((t: any) => ({ 
                name: t.name, 
                color: t.color, 
                icon: t.icon, 
                isSprintEligible: t.isSprintEligible,
                boardConfig: t.boardConfig,
                fields: t.fields.map((f: any) => ({ name: f.name, type: f.type })) 
            })),
            relations: relations.map((r: any) => ({ parent: r.parentNodeType.name, child: r.childNodeTypeType.name })),
            allRelations: relations.map((r: any) => ({ parent: r.parentNodeType.name, child: r.childNodeTypeType.name }))
        }}
      />
      <div className="grid grid-cols-3 gap-xl mb-2xl">
        {initialNodeTypes.map((type) => (
          <div key={type.id} className="card-sanctuary p-xl relative overflow-hidden">
            <div className="node-accent-strip" style={{ backgroundColor: type.color }} />
            
            <div className="flex justify-between items-start mb-lg">
              <div className="flex items-center gap-md">
                <div className="node-icon-box" style={{ backgroundColor: `${type.color}15`, borderColor: `${type.color}30` }}>
                  <IconRenderer name={type.icon} color={type.color} size={24} />
                </div>
                <div>
                  <h3 className="text-editorial text-lg font-bold">{type.name}</h3>
                  <p className="text-meta text-xs">ID: {type.id.slice(-6)}</p>
                </div>
              </div>
              <Button 
                variant="ghost"
                onClick={() => deleteNodeType(projectId, type.id)}
                icon={<Trash2 size={18} />}
                className="p-xs"
              />
            </div>
            
            <div className="mb-xl">
              <p className="node-section-label">Fields</p>
              <div className="flex flex-wrap gap-sm">
                {type.fields.map((field: any) => (
                  <span key={field.id} className="node-field-pill">
                    {field.name}
                  </span>
                ))}
                {type.fields.length === 0 && <span className="text-xs text-on-surface-variant">No fields defined</span>}
              </div>
            </div>

            <div className="flex gap-sm">
              <Button 
                onClick={() => {
                  setActiveNodeType(type);
                  setIsBoardEditorOpen(true);
                }}
                variant="secondary"
                size="sm"
                icon={<LayoutGrid size={16} />}
                className="flex-1"
              >
                Board Config
              </Button>
              <Button 
                onClick={() => {
                  setActiveNodeType(type);
                  setIsFieldEditorOpen(true);
                }}
                variant="secondary"
                size="sm"
                icon={<Braces size={16} />}
                className="flex-1"
              >
                Edit Fields
              </Button>
            </div>
          </div>
        ))}

        {!isCreating ? (
          <div 
            onClick={() => setIsCreating(true)}
            className="node-type-create-placeholder"
          >
            <div className="node-create-icon-container">
              <Plus size={32} color="var(--on-surface-variant)" />
            </div>
            <p className="text-editorial font-medium text-on-surface-variant">Create New Node Type</p>
          </div>
        ) : (
          <div className="card-sanctuary p-2xl">
            <h3 className="text-editorial text-lg font-bold mb-xl">New Node Type</h3>
            <form onSubmit={handleCreate}>
              <div className="mb-lg">
                <label className="text-meta block text-sm mb-sm">Name</label>
                <input 
                  autoFocus
                  className="input-premium" 
                  placeholder="e.g. Legendary, Research..." 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required 
                />
              </div>

              <div className="mb-lg">
                <label className="text-meta block text-sm mb-sm">Icon</label>
                <IconPicker 
                  currentIcon={newIcon} 
                  onSelect={setNewIcon} 
                  color={newColor} 
                />
              </div>

              <div className="mb-2xl">
                <label className="text-meta block text-sm mb-lg">Color Palette</label>
                <PremiumColorPicker 
                  currentColor={newColor} 
                  onSelect={setNewColor} 
                />
              </div>

              <div className="flex gap-md">
                <Button type="submit" className="flex-1">Create Type</Button>
                <Button 
                  variant="ghost"
                  type="button" 
                  onClick={() => setIsCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      <FieldEditor 
        projectId={projectId}
        nodeType={activeNodeType} 
        isOpen={isFieldEditorOpen} 
        onClose={() => {
          setIsFieldEditorOpen(false);
          setActiveNodeType(null);
        }} 
      />

      <BoardConfigEditor 
        projectId={projectId}
        nodeType={activeNodeType}
        isOpen={isBoardEditorOpen}
        onClose={() => {
          setIsBoardEditorOpen(false);
          setActiveNodeType(null);
        }}
      />
    </div>
  );
}
