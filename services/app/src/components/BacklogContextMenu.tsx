"use client";

import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Archive, ArchiveRestore } from "lucide-react";
import { archiveNode } from "@/lib/actions";

export function BacklogContextMenu({ projectId, node, contextMenu, onClose }: any) {
  if (!contextMenu) return null;

  return (
    <AnimatePresence>
      <div className="context-menu-overlay" onClick={onClose} />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="context-menu"
        style={{ top: contextMenu.y, left: contextMenu.x }}
      >
        <button 
          onClick={async () => { await archiveNode(projectId, node.id, !node.isArchived); onClose(); }} 
          className="context-menu-item"
        >
          {node.isArchived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
          {node.isArchived ? "Restore Node" : "Archive Node"}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
