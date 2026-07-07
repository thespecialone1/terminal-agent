import { streamText } from 'ai';
import { getProvider } from './provider.ts';
import { agentTools } from '../tools/index.ts';
import { getApiKey } from '../app/config.ts';

export async function* streamChatResponse(messages: any[], activeProvider: string, activeVariant: string) {
  const apiKey = getApiKey(activeProvider);
  if (apiKey) {
    if (activeProvider === 'deepseek') process.env.DEEPSEEK_API_KEY = apiKey;
    if (activeProvider === 'openai') process.env.OPENAI_API_KEY = apiKey;
    if (activeProvider === 'anthropic') process.env.ANTHROPIC_API_KEY = apiKey;
  }

  const { fullStream } = streamText({
    model: getProvider(activeProvider, activeVariant),
    system: "You are a helpful CLI AI assistant. Keep your answers extremely concise and brief unless the user asks for detailed explanations. Do not output markdown codeblocks unless specifically necessary.",
    messages,
    tools: agentTools as any,
  });

  for await (const part of fullStream) {
    yield part;
  }
}
