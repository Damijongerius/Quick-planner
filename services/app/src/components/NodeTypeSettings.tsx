"use client";

import { useState, useEffect } from "react";
import { Plus, FileJson } from "lucide-react";
import { createNodeType, getRelations } from "@/lib/actions";
import { FieldEditor } from "./FieldEditor";
import { BoardConfigEditor } from "./BoardConfigEditor";
import { AIImportModal } from "./ai/AIImportModal";
import { Button } from "./ui/Button";
import { NodeTypeCard } from "./NodeTypeCard";

export function NodeTypeSettings({ projectId, initialNodeTypes }: any) {
  const [activeNodeType, setActiveNodeType] = useState<any>(null);
  const [isFieldEditorOpen, setIsFieldEditorOpen] = useState(false);
  const [isBoardEditorOpen, setIsBoardEditorOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [relations, setRelations] = useState<any[]>([]);

  useEffect(() => { getRelations(projectId).then(setRelations); }, [projectId]);

  const handleCreate = async (e: React.FormEvent) => {
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
        <Button onClick={() => setIsAIModalOpen(true)} size="sm" icon={<FileJson size={18} />}>AI ARCHITECT</Button>
      </div>

      <div className="grid grid-cols-3 gap-xl mb-2xl">
        {initialNodeTypes.map((type: any) => (
          <NodeTypeCard key={type.id} projectId={projectId} type={type} onOpenBoardConfig={(t) => { setActiveNodeType(t); setIsBoardEditorOpen(true); }} onOpenFieldEditor={(t) => { setActiveNodeType(t); setIsFieldEditorOpen(true); }} />
        ))}

        {!isCreating ? (
          <div onClick={() => setIsCreating(true)} className="node-type-create-placeholder"><Plus size={32} /><p className="font-bold">ADD BLUEPRINT</p></div>
        ) : (
          <div className="card-sanctuary p-xl border-2 border-primary animate-in zoom-in-95">
            <h3 className="text-editorial font-bold mb-md">New Blueprint</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-md">
              <input autoFocus className="input-sanctuary" placeholder="Type Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
              <div className="flex gap-sm"><Button type="submit" className="flex-1">Create</Button><Button variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button></div>
            </form>
          </div>
        )}
      </div>

      <FieldEditor projectId={projectId} nodeType={activeNodeType} isOpen={isFieldEditorOpen} onClose={() => setIsFieldEditorOpen(false)} />
      <BoardConfigEditor projectId={projectId} nodeType={activeNodeType} isOpen={isBoardEditorOpen} onClose={() => setIsBoardEditorOpen(false)} />
      <AIImportModal projectId={projectId} isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} mode="NODE_TYPES" context={{ nodeTypes: initialNodeTypes.map((t: any) => ({ name: t.name, color: t.color, icon: t.icon, isSprintEligible: t.isSprintEligible, boardConfig: t.boardConfig, fields: t.fields.map((f: any) => ({ name: f.name, type: f.type })) })), relations: relations.map((r: any) => ({ parent: r.parentNodeType.name, child: r.childNodeTypeType.name })) }} />
    </div>
  );
}
