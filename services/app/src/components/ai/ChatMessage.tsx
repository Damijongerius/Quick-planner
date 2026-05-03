"use client";

import { Bot, User, Brain } from 'lucide-react';
import { ToolInvocation } from './ToolInvocation';
import ReactMarkdown from 'react-markdown';

interface MessageProps {
  message: {
    role: string;
    content: string;
    reasoning?: string;
    toolInvocations?: any[];
  };
}

export function ChatMessage({ message }: MessageProps) {
  const isUser = message.role === 'user';

  return (
    <div style={{ 
      display: 'flex', 
      gap: '16px', 
      flexDirection: isUser ? 'row-reverse' : 'row',
      alignItems: 'flex-start'
    }}>
      <div style={{ 
        width: '32px', 
        height: '32px', 
        borderRadius: '8px', 
        backgroundColor: isUser ? 'var(--surface-container-high)' : 'var(--primary)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: isUser ? 'var(--on-surface)' : 'white',
        flexShrink: 0
      }}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div style={{ 
        maxWidth: '80%',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {message.reasoning && (
          <div style={{ 
            padding: '12px 16px',
            borderRadius: '16px',
            backgroundColor: 'rgba(70, 86, 184, 0.05)',
            border: '1px solid rgba(70, 86, 184, 0.1)',
            color: 'var(--on-surface-variant)',
            fontSize: '12px',
            fontStyle: 'italic',
            display: 'flex',
            gap: '8px',
            alignItems: 'flex-start'
          }}>
            <Brain size={14} style={{ marginTop: '2px', flexShrink: 0, color: 'var(--primary)' }} />
            <span>{message.reasoning}</span>
          </div>
        )}

        <div style={{ 
          padding: '12px 16px',
          borderRadius: '16px',
          backgroundColor: isUser ? 'var(--primary)' : 'var(--surface-container-low)',
          color: isUser ? 'white' : 'var(--on-surface)',
          fontSize: '14px',
          lineHeight: 1.5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        }}>
          <ReactMarkdown 
            components={{
              p: ({children}) => <p style={{ margin: 0, marginBottom: '8px' }}>{children}</p>,
              ul: ({children}) => <ul style={{ paddingLeft: '20px', marginBottom: '8px' }}>{children}</ul>,
              ol: ({children}) => <ol style={{ paddingLeft: '20px', marginBottom: '8px' }}>{children}</ol>,
              code: ({children}) => <code style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: '4px', fontSize: '12px' }}>{children}</code>,
            }}
          >
            {message.content}
          </ReactMarkdown>
          
          {message.toolInvocations?.map((invoc) => (
            <ToolInvocation 
              key={invoc.toolCallId} 
              toolInvocation={invoc}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
