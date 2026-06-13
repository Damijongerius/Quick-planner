import { useState, useEffect } from "react";
import { Message } from "./ChatMessage";
import { runAIChatLoop } from "./AIChatLoop";
import { executeTool } from "./AIChatToolExecutor";

export interface UseAIChatResult {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  statusText: string;
  pendingToolCalls: {
    toolCalls: any[];
    currentMessages: Message[];
    loopCount: number;
  } | null;
  sendMessage: () => Promise<void>;
  handleApproveTools: () => Promise<void>;
  handleRejectTools: () => void;
}

export function useAIChat(projectId?: string): UseAIChatResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("qwen2.5:7b");

  const [pendingToolCalls, setPendingToolCalls] = useState<{
    toolCalls: any[];
    currentMessages: Message[];
    loopCount: number;
  } | null>(null);

  useEffect(() => {
    const loadSettings = () => {
      const savedUrl = localStorage.getItem("qp_ollama_url");
      const savedModel = localStorage.getItem("qp_ollama_model");
      if (savedUrl) setOllamaUrl(savedUrl);
      if (savedModel) setOllamaModel(savedModel);
    };

    loadSettings();

    window.addEventListener("qp_settings_changed", loadSettings);
    return () => {
      window.removeEventListener("qp_settings_changed", loadSettings);
    };
  }, []);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: "user", content: input };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    
    const now = new Date();
    const systemInstruction = `You are the QuickPlanner AI Assistant, an intelligent and helpful agent integrated directly into the QuickPlanner platform. Your role is to help the user manage their projects and answer their questions. You have access to local tools to modify project settings, create planning items, list sprints, etc. Use your tools proactively when the user asks you to perform actions. Keep your responses concise, friendly, and professional.

IMPORTANT DEFINITIONS (UNDERSTAND THE DIFFERENCE):
1. Blueprint: A blueprint/schema definition of a custom planning type configured in the project (e.g. Epic, Story, Task, Bug, Milestone). In the database schema it is referred to as "NodeType". When communicating with the user, ALWAYS refer to it as a "blueprint" (never "node type" or "type").
- To view existing blueprints and read their custom field/property definitions (e.g. to inspect or copy attributes from one blueprint to another), use "get_blueprint".
- To create a blueprint, use "create_blueprint".
- To update/modify a blueprint (e.g. rename, change color/icon, or sprint eligibility), use "update_blueprint".
- To remove/delete a blueprint, use "delete_blueprint".
- To connect blueprints (establish parent-child relations), use "connect_blueprint".
- To disconnect blueprint relations, use "disconnect_blueprint".
- To define field properties on a blueprint (e.g. TEXT, NUMBER, DATE, CHECKBOX, or SELECT with options), use "define_blueprint_field".

2. Planning Item (Node): An actual planning item/task instance created under a blueprint (e.g. "Implement Auth Logic" of type Task). When communicating with the user, refer to it as a "planning item" or "task" (never "node").
- If the user asks you to create/update/delete a task, story, or task instance, you must create a Node (using create_node, update_node, delete_node).

CURRENT TIME: Today's date is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. The current time is ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. When the user specifies relative terms like "today", "tomorrow", "next Monday", "next week", or "in 2 weeks", use this active calendar timestamp to calculate the exact calendar dates for tool arguments (sprint start/end dates or task deadlines).

${projectId ? `CURRENT CONTEXT: The user is currently active in the project ID "${projectId}". When the user asks you to perform actions like creating a node, updating task settings, listing sprints, or modifying configuration preferences, default to this project context ("${projectId}") unless they explicitly request a different project.` : ''}`;

    let currentMessages: Message[] = [
      { role: "system", content: systemInstruction },
      ...updatedMessages
    ];

    await runAIChatLoop(
      currentMessages,
      0,
      ollamaModel,
      ollamaUrl,
      projectId,
      setMessages,
      setPendingToolCalls,
      setIsLoading,
      setStatusText
    );
  };

  const handleApproveTools = async () => {
    if (!pendingToolCalls) return;

    const { toolCalls, currentMessages, loopCount } = pendingToolCalls;
    setPendingToolCalls(null);
    setIsLoading(true);
    setStatusText("Executing approved operations...");

    try {
      const updatedMessages = [...currentMessages];

      for (const toolCall of toolCalls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments || "{}");

        setStatusText(`Running: ${name}...`);
        const result = await executeTool(name, args, projectId);

        updatedMessages.push({
          role: "tool",
          tool_call_id: toolCall.id || `call_${Math.random().toString(36).substring(2, 11)}`,
          name: name,
          content: JSON.stringify(result)
        });
      }

      await runAIChatLoop(
        updatedMessages,
        loopCount,
        ollamaModel,
        ollamaUrl,
        projectId,
        setMessages,
        setPendingToolCalls,
        setIsLoading,
        setStatusText
      );

    } catch (err: any) {
      console.error("Approved tools execution error:", err);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: `Error running tools: ${err.message || String(err)}`
      }]);
      setIsLoading(false);
      setStatusText("");
    }
  };

  const handleRejectTools = () => {
    if (!pendingToolCalls) return;

    setPendingToolCalls(null);
    setMessages(prev => [...prev, {
      role: "assistant",
      content: "Operation cancelled. Write actions were not executed."
    }]);
  };

  return {
    messages,
    setMessages,
    input,
    setInput,
    isLoading,
    statusText,
    pendingToolCalls,
    sendMessage,
    handleApproveTools,
    handleRejectTools
  };
}
