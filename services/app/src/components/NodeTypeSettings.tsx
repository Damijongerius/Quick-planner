"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { createNodeType, getRelations } from "@/lib/actions";
import { FieldEditor } from "./FieldEditor";
import { BoardConfigEditor } from "./BoardConfigEditor";

import { Button } from "./ui/Button";
import { NodeTypeCard } from "./NodeTypeCard";
import { NodeType, AllowedRelation, FieldDefinition } from "@/lib/types";

export function NodeTypeSettings({ projectId, initialNodeTypes }: Readonly<{ projectId: string; initialNodeTypes: NodeType[] }>) {
  const [activeNodeType, setActiveNodeType] = useState<NodeType | null>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [relations, setRelations] = useState<AllowedRelation[]>([]);

  useEffect(() => { getRelations(projectId).then(setRelations); }, [projectId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", newName); formData.append("color", "#3b82f6"); formData.append("icon", "Target");
    await createNodeType(projectId, formData);
    setNewName(""); setIsCreating(false);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-xl">
        <div><h2 className="text-editorial text-2xl font-bold">Node Ecosystem</h2><p className="text-meta text-xs mt-xs">Define types and allowed relations</p></div>
      </div>

      <div className="grid grid-cols-3 gap-xl mb-2xl">
        {initialNodeTypes.map((type: NodeType) => (
          <NodeTypeCard key={type.id} projectId={projectId} type={type} onOpenBoardConfig={(t) => { setActiveNodeType(t); setIsBoardEditorOpen(true); }} onOpenFieldEditor={(t) => { setActiveNodeType(t); setIsFieldEditorOpen(true); }} />
        ))}

        {isCreating ? (
          <div className="card-planner p-xl border-2 border-primary animate-in zoom-in-95">
            <h3 className="text-editorial font-bold mb-md">New Blueprint</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-md">
              <input autoFocus className="input-planner" placeholder="Type Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <div className="flex gap-sm"><Button type="submit" className="flex-1">Create</Button><Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button></div>
            </form>
          </div>
        ) : (
          <button 
            onClick={() => setIsCreating(true)} 
            className="node-type-create-placeholder"
            aria-label="Add new blueprint"
          >
            <Plus size={32} />
            <p className="font-bold">ADD BLUEPRINT</p>
          </button>
        )}
      </div>

      <FieldEditor projectId={projectId} nodeType={activeNodeType} isOpen={isFieldEditorOpen} onClose={() => setIsFieldEditorOpen(false)} />
      <BoardConfigEditor projectId={projectId} nodeType={activeNodeType} isOpen={isBoardEditorOpen} onClose={() => setIsBoardEditorOpen(false)} />
    </div>
  );
}
