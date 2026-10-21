"use client";

import React, { useEffect } from "react";
import "./Modal.css";
import { motion } from "framer-motion";
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
}: Readonly<ModalProps>) {
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay" 
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      }}
      role="none"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="modal-content"
        style={{ '--modal-max-width': maxWidth } as React.CSSProperties}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button onClick={onClose} className="icon-button shrink-0" aria-label="Close">
            <X size={18} />
          </button>
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
