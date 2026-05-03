"use client";

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChatWindow } from './ai/ChatWindow';

interface AIChatDrawerProps {
  projectId: string;
}

export function AIChatDrawer({ projectId }: AIChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => setIsOpen(true)}
            className="button-premium"
            style={{
              position: 'fixed',
              bottom: '32px',
              right: '32px',
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              zIndex: 100,
              boxShadow: '0 8px 32px rgba(70, 86, 184, 0.4)'
            }}
          >
            <Sparkles size={28} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Drawer Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="glass"
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              bottom: '24px',
              width: '450px',
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '32px',
              overflow: 'hidden',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid var(--outline-variant)'
            }}
          >
            <ChatWindow 
              projectId={projectId} 
              onClose={() => setIsOpen(false)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
