"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Sparkles, Check, X as XIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useParams, useRouter } from "next/navigation";

interface PendingAction {
  tool: string;
  args: Record<string, unknown>;
  summary: string;
}

interface Message {
  role: "user" | "model";
  content: string;
  pendingActions?: PendingAction[];
  pendingState?: "open" | "confirmed" | "cancelled";
}

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string | undefined;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: Message = { role: "user", content: text };
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
            messages: [...messages, userMessage].map(({ role, content }) => ({ role, content })),
            projectId: projectId || null,
          }),
        });

        const data = await response.json().catch(() => ({ error: "Invalid response from server" }));

        // Only server-side failures are worth retrying; auth / rate-limit errors are final.
        if (response.status >= 500) {
          throw new Error(data.error || "Server error");
        }
        if (data.error) {
          setMessages((prev) => [...prev, { role: "model", content: `Error: ${data.error}` }]);
        } else {
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              content: data.text || "",
              pendingActions: data.pendingActions,
              pendingState: data.pendingActions?.length ? "open" : undefined,
            },
          ]);
        }
        success = true;
      } catch (error: unknown) {
        attempts++;
        errorMessage = (error instanceof Error && error.message) || "Failed to connect to the AI server.";
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

  const resolvePending = async (index: number, confirm: boolean) => {
    const target = messages[index];
    if (!target?.pendingActions || target.pendingState !== "open") return;

    setMessages((prev) => prev.map((m, i) => (i === index ? { ...m, pendingState: confirm ? "confirmed" : "cancelled" } : m)));
    if (!confirm) {
      setMessages((prev) => [...prev, { role: "model", content: "Okay, I won't make that change." }]);
      return;
    }

    setIsLoading(true);
    try {
      const results: string[] = [];
      for (const action of target.pendingActions) {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId: projectId || null, confirmAction: { tool: action.tool, args: action.args } }),
        });
        const data = await response.json().catch(() => ({ error: "Invalid response from server" }));
        results.push(data.error ? `Error: ${data.error}` : data.text);
      }
      setMessages((prev) => [...prev, { role: "model", content: results.join("\n\n") }]);
      router.refresh(); // the assistant changed data behind the page's back
    } catch {
      setMessages((prev) => [...prev, { role: "model", content: "Error: failed to apply the change." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = ["What's in the active sprint?", "List overdue items", "Create a task for tomorrow"];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-panel shadow-lg">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-soft text-accent"><Sparkles size={14} /></span>
        <h2 className="text-sm font-semibold">Assistant</h2>
        <span className="ml-auto text-xs text-faint">{projectId ? "This project" : "All projects"}</span>
      </header>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-bg p-4" aria-live="polite">
        {messages.length === 0 ? (
          <div className="m-auto flex max-w-[260px] flex-col items-center gap-3 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-accent"><Sparkles size={18} /></span>
            <p className="text-sm text-muted">Ask about your plan, or have me create and update items. I always ask before changing anything.</p>
            <div className="flex flex-col gap-1.5 self-stretch">
              {suggestions.map((q) => (
                <button key={q} onClick={() => sendMessage(q)} className="rounded-md border border-border-strong bg-panel px-3 py-1.5 text-left text-sm text-fg transition-colors hover:bg-hover">
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-accent text-accent-fg" : "border border-border bg-panel"}`}>
                <div className="ai-md"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                {msg.pendingActions?.map((action, i) => (
                  <pre key={i} className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-hover p-2 text-xs text-fg">{action.summary}{"\n"}{JSON.stringify(action.args, null, 2)}</pre>
                ))}
                {msg.pendingState === "open" && (
                  <div className="mt-2 flex gap-2">
                    <button onClick={() => resolvePending(idx, true)} disabled={isLoading} className="button-base button-primary button-sm"><Check size={13} /> Confirm</button>
                    <button onClick={() => resolvePending(idx, false)} disabled={isLoading} className="button-base button-secondary button-sm"><XIcon size={13} /> Cancel</button>
                  </div>
                )}
                {msg.pendingState === "confirmed" && <p className="mt-2 text-xs text-success">Confirmed</p>}
                {msg.pendingState === "cancelled" && <p className="mt-2 text-xs text-faint">Cancelled</p>}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start" role="status" aria-label="Assistant is thinking">
            <div className="flex gap-1 rounded-lg border border-border bg-panel px-3 py-3">
              {[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-faint" style={{ animationDelay: `${i * 150}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="flex items-center gap-2 border-t border-border p-3" onSubmit={(e) => { e.preventDefault(); sendMessage(); }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask or give an instruction…"
          aria-label="Message"
          className="input-planner"
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !input.trim()} aria-label="Send" className="button-base button-primary" style={{ width: 34, height: 34, padding: 0 }}>
          <ArrowUp size={16} />
        </button>
      </form>
    </div>
  );
}
