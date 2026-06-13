import { Message } from "./ChatMessage";
import { tools } from "./AIChatTools";
import { writeTools } from "./AIChatHelpers";
import { executeTool } from "./AIChatToolExecutor";

export async function runAIChatLoop(
  currentMessages: Message[],
  startLoopCount: number,
  ollamaModel: string,
  ollamaUrl: string,
  projectId: string | undefined,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  setPendingToolCalls: React.Dispatch<React.SetStateAction<any>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setStatusText: React.Dispatch<React.SetStateAction<string>>
) {
  setIsLoading(true);
  setStatusText("Thinking...");

  try {
    let loop = true;
    let loopCount = startLoopCount;
    const maxLoops = 6;

    while (loop && loopCount < maxLoops) {
      loopCount++;

      const payload = {
        model: ollamaModel,
        messages: currentMessages.map(m => ({
          role: (m.role as string) === "model" ? "assistant" : m.role,
          content: m.content || "",
          tool_calls: m.tool_calls,
          tool_call_id: m.tool_call_id,
          name: m.name
        })),
        tools: tools,
        stream: false
      };

      const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Ollama request failed: ${response.statusText} (Is Ollama running locally?)`);
      }

      const data = await response.json();
      const choice = data.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) throw new Error("Empty response from Ollama");

      currentMessages.push({
        role: "assistant",
        content: assistantMessage.content || "",
        tool_calls: assistantMessage.tool_calls
      });

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        const toolCalls = assistantMessage.tool_calls;
        const containsWriteTool = toolCalls.some((tc: any) =>
          writeTools.includes(tc.function.name)
        );

        if (containsWriteTool) {
          setMessages(prev => [...prev, { role: "assistant", content: null, tool_calls: toolCalls }]);
          setPendingToolCalls({ toolCalls, currentMessages: [...currentMessages], loopCount });
          loop = false;
        } else {
          for (const toolCall of toolCalls) {
            const name = toolCall.function.name;
            const args = JSON.parse(toolCall.function.arguments || "{}");

            setStatusText(`Running tool: ${name}...`);
            const result = await executeTool(name, args, projectId);

            currentMessages.push({
              role: "tool",
              tool_call_id: toolCall.id || `call_${Math.random().toString(36).substring(2, 11)}`,
              name: name,
              content: JSON.stringify(result)
            });
          }
        }
      } else {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: assistantMessage.content || "Action complete."
        }]);
        loop = false;
      }
    }

    if (loopCount >= maxLoops) throw new Error("Maximum AI tool invocation loop depth reached.");
  } catch (error: any) {
    console.error("AI Chat Error:", error);
    setMessages(prev => [...prev, {
      role: "assistant",
      content: `Error: ${error.message || "Failed to communicate with local Ollama."}`
    }]);
  } finally {
    setIsLoading(false);
    setStatusText("");
  }
}
