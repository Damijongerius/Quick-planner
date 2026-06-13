import React, { useState } from "react";
import { Bot, User, ShieldAlert, ChevronDown, Brain } from "lucide-react";
import ReactMarkdown from "react-markdown";

export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content?: string | null;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

interface ChatMessageProps {
  msg: Message;
  pendingToolCalls: any;
  isLast: boolean;
  getHumanReadableAction: (name: string, args: any) => string;
  handleRejectTools: () => void;
  handleApproveTools: () => void;
}

export function ChatMessage({
  msg,
  pendingToolCalls,
  isLast,
  getHumanReadableAction,
  handleRejectTools,
  handleApproveTools
}: Readonly<ChatMessageProps>) {
  const isUser = msg.role === "user";
  const [showThinking, setShowThinking] = useState(false);

  // Parse `<think>...</think>` tags
  let thinkingContent = "";
  let cleanContent = msg.content || "";

  if (msg.role === "assistant" && msg.content) {
    const match = msg.content.match(/<think>([\s\S]*?)<\/think>/i);
    if (match) {
      thinkingContent = match[1].trim();
      cleanContent = msg.content.replace(/<think>[\s\S]*?<\/think>/i, "").trim();
    }
  }

  return (
    <div className={`ai-message-bubble ${isUser ? "user" : "model"}`}>
      <div className="ai-message-avatar">
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className="ai-message-content">
        {/* Render Collapsible Thinking Process */}
        {!isUser && thinkingContent && (
          <div className="ai-thinking-box">
            <div
              className={`ai-thinking-header ${showThinking ? "open" : ""}`}
              onClick={() => setShowThinking(!showThinking)}
            >
              <Brain size={14} className="text-primary" />
              <span>AI Thinking Process</span>
              <ChevronDown size={14} className="chevron-icon" />
            </div>
            {showThinking && (
              <div className="ai-thinking-content">
                {thinkingContent}
              </div>
            )}
          </div>
        )}

        {cleanContent && <ReactMarkdown>{cleanContent}</ReactMarkdown>}

        {msg.tool_calls && msg.tool_calls.length > 0 && (
          <div className="proposed-actions-list">
            <div className="proposed-actions-header">
              <ShieldAlert size={14} className="text-primary" />
              <span className="proposed-actions-title">Proposed Operations</span>
            </div>
            <div className="proposed-actions-body">
              {msg.tool_calls.map((tc: any, tcIdx: number) => {
                const name = tc.function?.name || tc.name;
                const args = JSON.parse(tc.function?.arguments || tc.arguments || "{}");
                return (
                  <div key={tcIdx} className="proposed-action-item">
                    <span className="bullet">•</span>
                    <span className="action-text">{getHumanReadableAction(name, args)}</span>
                  </div>
                );
              })}
            </div>

            {pendingToolCalls && isLast && (
              <div className="proposed-actions-footer">
                <button
                  onClick={handleRejectTools}
                  className="action-button reject"
                  type="button"
                >
                  Reject
                </button>
                <button
                  onClick={handleApproveTools}
                  className="action-button approve"
                  type="button"
                >
                  Approve & Execute
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
