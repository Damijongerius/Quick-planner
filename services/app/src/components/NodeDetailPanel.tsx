"use client";

import { useState, useEffect } from "react";
import { X, Calendar, Tag, Box, AlertTriangle, Trash2, Save } from "lucide-react";
import { getNode, deleteNode, updateNode } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { IconRenderer } from "./IconPicker";

interface NodeDetailPanelProps {
  projectId: string;
  nodeId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

export function NodeDetailPanel({ projectId, nodeId, isOpen, onClose, onUpdate }: NodeDetailPanelProps) {
  const [node, setNode] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen && nodeId) {
      loadNode();
    }
  }, [isOpen, nodeId]);

  const loadNode = async () => {
    setIsLoading(true);
    const data = await getNode(projectId, nodeId);
    setNode(data);
    setTitle(data?.title || "");
    setIsLoading(false);
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
    <div className="glass" style={{ width: '400px', height: '100%', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Node Details</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={24} />
        </button>
      </header>

      {isLoading ? (
        <p>Loading...</p>
      ) : node ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280', marginBottom: '8px' }}>TITLE</label>
            <input 
              className="input-premium" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={handleUpdate} className="button-premium" style={{ flex: 1 }}>
              <Save size={18} /> Save
            </button>
            <button onClick={handleDelete} className="button-secondary" style={{ color: '#ef4444' }}>
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      ) : (
        <p>Node not found</p>
      )}
    </div>
  );
}
