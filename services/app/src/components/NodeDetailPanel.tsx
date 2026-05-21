"use client";

import { useState, useEffect } from "react";
import { X, Trash2, Save } from "lucide-react";
import { getNode, deleteNode, updateNode } from "@/lib/actions";
import { Node } from "@/lib/types";
import { Button } from "./ui/Button";

interface NodeDetailPanelProps {
  projectId: string;
  nodeId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function NodeDetailPanel({ projectId, nodeId, isOpen, onClose, onUpdate }: Readonly<NodeDetailPanelProps>) {
  const [node, setNode] = useState<Node | null>(null);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && nodeId) {
      const fetchData = async () => {
        setIsLoading(true);
        const data = await getNode(projectId, nodeId);
        setNode(data);
        setTitle(data?.title || "");
        setIsLoading(false);
      };
      fetchData();
    }
  }, [isOpen, nodeId, projectId]);

  const loadNode = async () => {
    const data = await getNode(projectId, nodeId);
    setNode(data);
    setTitle(data?.title || "");
  };

  const handleUpdate = async () => {
    await updateNode(projectId, nodeId, { title });
    onUpdate?.();
    loadNode();
  };

  const handleDelete = async () => {
    if (confirm("Delete this node?")) {
      await deleteNode(projectId, nodeId);
      onClose();
      onUpdate?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="side-panel-container glass p-xl">
      <header className="modal-header">
        <h3 className="text-xl font-bold">Node Details</h3>
        <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface-variant hover:text-on-surface shrink-0">
          <X size={24} />
        </button>
      </header>

      {isLoading && <p className="text-secondary p-xl text-center">Loading...</p>}
      
      {!isLoading && node && (
        <div className="flex flex-col gap-xl">
          <div>
            <label htmlFor="node-title" className="text-meta block mb-sm">TITLE</label>
            <input 
              id="node-title"
              className="input-premium" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div className="flex gap-md">
            <Button onClick={handleUpdate} className="flex-1">
              <Save size={18} /> Save
            </Button>
            <Button onClick={handleDelete} variant="secondary" className="text-error">
              <Trash2 size={18} />
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !node && (
        <p className="text-error p-xl text-center">Node not found</p>
      )}
    </div>
  );
}
