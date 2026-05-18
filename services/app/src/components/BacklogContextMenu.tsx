"use client";

import React from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Archive, ArchiveRestore } from "lucide-react";
import { archiveNode } from "@/lib/actions";
import { Node } from "@/lib/types";

interface BacklogContextMenuProps {
  projectId: string;
  node: Node & { isArchived?: boolean };
  contextMenu: { x: number, y: number } | null;
  onClose: () => void;
}

export function BacklogContextMenu({ projectId, node, contextMenu, onClose }: Readonly<BacklogContextMenuProps>) {
  if (!contextMenu) return null;

  return (
    <AnimatePresence>
      <button 
        className="context-menu-overlay" 
        onClick={onClose} 
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            onClose();
          }
        }}
        aria-label="Close context menu"
        style={{ background: 'transparent', border: 'none', padding: 0 }}
      />
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
          {node.isArchived ? (
            <>
              <ArchiveRestore size={16} /> Restore Node
            </>
          ) : (
            <>
              <Archive size={16} /> Archive Node
            </>
          )}
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
