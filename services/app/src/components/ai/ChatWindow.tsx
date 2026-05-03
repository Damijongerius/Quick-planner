"use client";

import { useChat } from '@ai-sdk/react';
import { useRef, useEffect } from 'react';
import { Bot, X, Sparkles } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatWindowProps {
  projectId: string;
  onClose: () => void;
}

export function ChatWindow({ projectId, onClose }: ChatWindowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/ai',
    body: { projectId },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
    }}>
      <header style={{ 
        padding: '24px 32px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid var(--outline-variant)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '12px', 
            backgroundColor: 'var(--primary)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'white'
          }}>
            <Bot size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Project Oracle</h3>
            <p className="text-meta" style={{ fontSize: '9px', opacity: 0.6 }}>AI Assistant</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: 'var(--on-surface-variant)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>
      </header>

      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5 }}>
            <Sparkles size={48} style={{ margin: '0 auto 16px', color: 'var(--primary)' }} />
            <p style={{ fontWeight: 700 }}>How can I help with your project?</p>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>I can search the web, analyze your backlog,<br/>or create tasks for you.</p>
          </div>
        )}

        {messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
      </div>

      <ChatInput 
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isLoading={isLoading}
      />
    </div>
  );
}
