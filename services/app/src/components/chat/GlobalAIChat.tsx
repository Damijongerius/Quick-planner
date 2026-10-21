"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { AIChat } from "./AIChat";
import { AnimatePresence, motion } from "framer-motion";

export function GlobalAIChat() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-[300] max-sm:bottom-3 max-sm:right-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-14 right-0 h-[560px] max-h-[calc(100vh-110px)] w-[380px] max-sm:fixed max-sm:inset-x-3 max-sm:bottom-16 max-sm:top-3 max-sm:h-auto max-sm:max-h-none max-sm:w-auto"
            role="dialog"
            aria-label="Assistant"
          >
            <AIChat />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        aria-expanded={isOpen}
        className="flex h-11 w-11 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        {isOpen ? <X size={20} /> : <Sparkles size={20} />}
      </button>
    </div>
  );
}
