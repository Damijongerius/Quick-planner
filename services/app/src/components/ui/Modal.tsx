"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer,
  maxWidth = "520px" 
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="modal-content"
        style={{ '--modal-max-width': maxWidth } as any}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h3 className="text-editorial text-2xl font-bold">{title}</h3>
            {subtitle && <p className="text-secondary">{subtitle}</p>}
          </div>
          <Button variant="ghost" onClick={onClose} size="sm">
            <X size={20} />
          </Button>
        </header>

        <div className="modal-body">
          {children}
        </div>

        {footer && (
          <footer className="modal-footer">
            {footer}
          </footer>
        )}
      </motion.div>
    </div>
  );
}
