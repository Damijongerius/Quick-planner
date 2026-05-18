"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useParams } from "next/navigation";
import "./AIChat.css";

interface Message {
  role: "user" | "model";
  content: string;
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const projectId = params?.projectId as string | undefined;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    let attempts = 0;
    const maxAttempts = 3;
    let success = false;
    let errorMessage = "Failed to connect to the AI server.";

    while (attempts < maxAttempts && !success) {
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [...messages, userMessage],
            projectId: projectId || null,
          }),
        });

        if (response.status === 500) {
          throw new Error("500 Internal Server Error");
        }

        const data = await response.json();
        
        if (data.error) {
          if (response.status === 500 || data.error.includes("500") || data.status === 500) {
            throw new Error(data.error);
          }
          setMessages((prev) => [...prev, { role: "model", content: `Error: ${data.error}` }]);
          success = true;
        } else {
          setMessages((prev) => [...prev, { role: "model", content: data.text }]);
          success = true;
        }
      } catch (error: any) {
        attempts++;
        errorMessage = error.message || "Failed to connect to the AI server.";
        if (attempts < maxAttempts) {
          // Wait 3 seconds before retrying
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }

    if (!success) {
      setMessages((prev) => [...prev, { role: "model", content: `Error: ${errorMessage} (Failed after ${maxAttempts} attempts)` }]);
    }
    setIsLoading(false);
  };

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
            <p>Hi! I'm your QuickPlanner AI Assistant.<br/>I can help modify project settings and node preferences via local MCP tools!</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`ai-message-bubble ${msg.role}`}>
              <div className="ai-message-avatar">
                {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
              </div>
              <div className="ai-message-content">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="ai-message-bubble model loading">
             <div className="ai-message-avatar"><Bot size={16} /></div>
             <Loader2 size={16} className="spinner" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="ai-chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Ask me to update project settings..."
          className="ai-chat-input"
          disabled={isLoading}
        />
        <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="ai-chat-send">
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}
