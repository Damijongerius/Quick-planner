"use client";

import React, { useRef, useEffect } from "react";
import { Send, Bot, Loader2, ShieldAlert } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { ChatMessage } from "./ChatMessage";
import { getHumanReadableAction } from "./AIChatHelpers";
import { useAIChat } from "./useAIChat";
import "./AIChat.css";

export function AIChat() {
  const searchParams = useSearchParams();
  const projectId = searchParams?.get("projectId") || undefined;
  
  const {
    messages,
    input,
    setInput,
    isLoading,
    statusText,
    pendingToolCalls,
    sendMessage,
    handleApproveTools,
    handleRejectTools
  } = useAIChat(projectId);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, statusText]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  if (!projectId) {
    return (
      <div className="ai-chat-container">
        <div className="ai-chat-header">
          <Bot className="ai-icon" />
          <h2>QuickPlanner AI Assistant</h2>
        </div>
        <div className="ai-chat-empty flex flex-col items-center justify-center p-xl text-center h-full" style={{ gap: '16px', minHeight: '60vh' }}>
          <ShieldAlert size={48} className="text-error" style={{ color: 'var(--error, #ef4444)' }} />
          <div>
            <p className="font-bold text-lg" style={{ color: 'var(--on-surface)' }}>AI Assistant Locked</p>
            <p className="text-meta text-xs mt-xs" style={{ color: 'var(--on-surface-variant)', opacity: 0.7, maxWidth: '240px', margin: '8px auto 0 auto' }}>
              Please open a project workspace first. The AI Assistant requires an active project context to function.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-container">
      <div className="ai-chat-header">
        <Bot className="ai-icon" />
        <h2>QuickPlanner AI Assistant</h2>
      </div>

      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <Bot size={48} className="empty-icon" />
            <p>Hi! I'm your QuickPlanner AI Assistant.<br />I connect to your local Ollama instance to help manage projects and nodes completely cost-free.</p>
          </div>
        ) : (
          (() => {
            const filtered = messages.filter(msg => msg.role === "user" || msg.role === "assistant");
            return filtered.map((msg, idx) => (
              <ChatMessage
                key={idx}
                msg={msg}
                pendingToolCalls={pendingToolCalls}
                isLast={idx === filtered.length - 1}
                getHumanReadableAction={getHumanReadableAction}
                handleRejectTools={handleRejectTools}
                handleApproveTools={handleApproveTools}
              />
            ));
          })()
        )}
        {isLoading && (
          <div className="ai-message-bubble model loading">
            <div className="ai-message-avatar"><Bot size={16} /></div>
            <div className="loading-indicator">
              <Loader2 size={16} className="spinner" />
              <span>{statusText}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-area">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder={pendingToolCalls ? "Please resolve pending action above..." : "Ask me to schedule a task or organize sprints..."}
          className="ai-chat-input"
          disabled={isLoading || !!pendingToolCalls}
          rows={1}
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim() || !!pendingToolCalls} className="ai-chat-send">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
