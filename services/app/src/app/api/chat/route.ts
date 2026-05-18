import { GoogleGenAI, Type, FunctionDeclaration, ThinkingLevel } from "@google/genai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let transport: SSEClientTransport | null = null;
  
  try {
    const { messages } = await req.json();

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

    const formattedMessages = messages.map((m: any) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const systemInstruction = `You are the QuickPlanner AI Assistant, an intelligent and helpful agent integrated directly into the QuickPlanner platform. Your role is to help the user manage their projects and answer their questions. You have access to local MCP tools to modify project settings, create nodes, and even search the web. Use your tools proactively when the user asks you to perform actions. Keep your responses concise, friendly, and professional.`;

    const response = await ai.models.generateContent({
      model: "gemma4:31b",
      contents: formattedMessages,
      config: {
        systemInstruction,
        tools: functionDeclarations.length > 0 ? [{ functionDeclarations }] : undefined,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW,
        },
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
            result = await mcpClient.callTool({
              name: call.name,
              arguments: call.args as Record<string, unknown>,
            });
        } catch (err: any) {
            result = { error: err.message };
        }
      } else {
        result = { error: "No tool name provided." };
      }

      // Pass result back to Gemini
      const secondResponse = await ai.models.generateContent({
        model: "gemma4:31b",
        contents: [
          ...formattedMessages,
          { role: 'model', parts: [{ functionCall: call }] },
          { role: 'user', parts: [{ functionResponse: { name: call.name, response: { result } } }] }
        ],
        config: {
          systemInstruction,
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.LOW,
          },
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
