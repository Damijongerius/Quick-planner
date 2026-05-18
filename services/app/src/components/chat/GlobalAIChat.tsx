"use client";

import React, { useState } from "react";
import { Bot, X } from "lucide-react";
import { AIChat } from "./AIChat";
import { AnimatePresence, motion } from "framer-motion";

export function GlobalAIChat() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999 }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '0',
              width: '400px',
              height: '600px',
              maxHeight: 'calc(100vh - 120px)',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
              borderRadius: '16px',
            }}
          >
            <AIChat />
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          outline: 'none',
        }}
      >
        {isOpen ? <X size={28} /> : <Bot size={28} />}
      </motion.button>
    </div>
  );
}
