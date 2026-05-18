import { GoogleGenAI, Type, FunctionDeclaration, ThinkingLevel } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/db";

export async function POST(req: Request) {
  let transport: SSEClientTransport | null = null;
  
  try {
    const { messages, projectId } = await req.json();

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Initialize MCP Client over HTTP/SSE
    // Use localhost if running dev script locally, else use the mcp docker container name
    const mcpUrl = process.env.MCP_SERVER_URL || "http://mcp:3001/sse";
    transport = new SSEClientTransport(new URL(mcpUrl));

    const mcpClient = new Client(
      { name: "QuickPlannerClient", version: "1.0.0" },
      { capabilities: {} }
    );

    await mcpClient.connect(transport);
    const { tools: mcpTools } = await mcpClient.listTools();

    // Map MCP tools to Gemini function declarations
    const functionDeclarations: FunctionDeclaration[] = mcpTools.map(tool => {
      const properties: Record<string, any> = {};
      const required: string[] = [];

      if (tool.inputSchema && tool.inputSchema.properties) {
        for (const [key, propUnknown] of Object.entries(tool.inputSchema.properties as any)) {
          const prop = propUnknown as any;
          properties[key] = {
            type: prop.type === "string" ? Type.STRING : prop.type === "boolean" ? Type.BOOLEAN : Type.OBJECT,
            description: prop.description || "",
          };
        }
      }
      
      if (tool.inputSchema && Array.isArray(tool.inputSchema.required)) {
         required.push(...tool.inputSchema.required);
      }

      return {
        name: tool.name,
        description: tool.description || `Tool: ${tool.name}`,
        parameters: {
          type: Type.OBJECT,
          properties: Object.keys(properties).length > 0 ? properties : undefined,
          required: required.length > 0 ? required : undefined,
        }
      };
    });

    const cleanMessages = messages.filter((m: any) => m.role !== 'system' && m.content && m.content.trim() !== '');
    const formattedMessages: any[] = [];
    
    for (const msg of cleanMessages) {
      const role = msg.role === 'user' ? 'user' : 'model';
      if (formattedMessages.length > 0 && formattedMessages[formattedMessages.length - 1].role === role) {
        formattedMessages[formattedMessages.length - 1].parts[0].text += "\n" + msg.content;
      } else {
        formattedMessages.push({
          role,
          parts: [{ text: msg.content }]
        });
      }
    }

    console.log("Formatted Messages Payload:", JSON.stringify(formattedMessages, null, 2));

    const modelName = process.env.AI_MODEL || "gemini-2.5-flash";
    const supportsThinking = modelName.includes("thinking");
    const supportsTools = modelName.includes("gemini");

    let systemInstruction = `You are the QuickPlanner AI Assistant, an intelligent and helpful agent integrated directly into the QuickPlanner platform. Your role is to help the user manage their projects and answer their questions. You have access to local MCP tools to modify project settings, create nodes, and even search the web. Use your tools proactively when the user asks you to perform actions. Keep your responses concise, friendly, and professional.`;

    // Inject real-time calendar context for exact date calculations
    const now = new Date();
    systemInstruction += `\n\nCURRENT TIME: Today's date is ${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. The current time is ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}. When the user specifies relative terms like "today", "tomorrow", "next Monday", "next week", or "in 2 weeks", use this active calendar timestamp to calculate the exact calendar dates for tool arguments (sprint start/end dates or task deadlines).`;

    if (projectId) {
      try {
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        });
        if (project) {
          systemInstruction += `\n\nCURRENT CONTEXT: The user is currently active in the project "${project.name}" (ID: ${project.id}). When the user asks you to perform actions like creating a node, updating task settings, listing sprints, or modifying configuration preferences, default to this project context ("${project.name}") unless they explicitly request a different project.`;
        }
      } catch (err) {
        console.error("Failed to query project context:", err);
      }
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: formattedMessages,
      config: {
        systemInstruction,
        tools: (supportsTools && functionDeclarations.length > 0) ? [{ functionDeclarations }] : undefined,
        thinkingConfig: supportsThinking ? {
          thinkingLevel: ThinkingLevel.LOW,
        } : undefined,
      }
    });

    // Handle tool calls
    let finalText = response.text;
    const toolCalls = response.functionCalls;
    
    if (toolCalls && toolCalls.length > 0) {
      const call = toolCalls[0]; // execute first tool call
      let result;
      if (call.name) {
        try {
            const session = await auth();
            const userId = session?.user?.id;
            const args = { ...call.args } as Record<string, unknown>;
            if (userId) {
              args.userId = userId;
            }

            result = await mcpClient.callTool({
              name: call.name,
              arguments: args,
            });
        } catch (err: any) {
            result = { error: err.message };
        }
      } else {
        result = { error: "No tool name provided." };
      }

      // Pass result back to Gemini
      const secondResponse = await ai.models.generateContent({
        model: modelName,
        contents: [
          ...formattedMessages,
          { role: 'model', parts: [{ functionCall: call }] },
          { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result } } }] }
        ],
        config: {
          systemInstruction,
          thinkingConfig: supportsThinking ? {
            thinkingLevel: ThinkingLevel.LOW,
          } : undefined,
        }
      });
      finalText = secondResponse.text;
    }

    await transport.close();

    return NextResponse.json({ text: finalText, thinking: response.candidates?.[0]?.content?.parts?.[0]?.thought });
  } catch (error: any) {
    console.error("Chat error:", error);
    if (transport) {
      try {
        await transport.close();
      } catch (e) {}
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
