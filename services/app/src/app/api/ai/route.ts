import { streamText } from 'ai';
import { createOllama } from 'ollama-ai-provider';
import { discoverOllama, ensureModel } from '@/lib/discovery';
import { getProjectTools } from '@/lib/ai-tools';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, projectId } = await req.json();

  const ollamaUrl = await discoverOllama();
  
  // Ensure the required model is available
  await ensureModel(ollamaUrl, 'gemma4:e2b');

  const ollama = createOllama({ baseURL: `${ollamaUrl}/api` });

  const result = await streamText({
    model: ollama('gemma4:e2b') as any,
    messages,
    system: `You are the Quick-planner AI Assistant. 
    You have access to the current project's backlog, sprints, and external web search.
    Current Project ID: ${projectId}
    When asked to create or update tasks, use the provided tools.`,
    tools: getProjectTools(projectId),
  });

  return result.toDataStreamResponse();
}
