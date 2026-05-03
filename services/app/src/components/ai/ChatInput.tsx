"use client";

import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading }: ChatInputProps) {
  return (
    <footer style={{ padding: '24px 32px', borderTop: '1px solid var(--outline-variant)' }}>
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
        <input
          className="input-premium"
          style={{ 
            padding: '16px 56px 16px 24px', 
            borderRadius: '20px',
            backgroundColor: 'var(--surface-container-low)'
          }}
          value={input}
          placeholder="Ask anything..."
          onChange={handleInputChange}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            opacity: isLoading || !input.trim() ? 0.5 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>
    </footer>
  );
}
