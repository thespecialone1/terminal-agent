import { generateText } from 'ai';
import { aiProvider } from './src/ai/provider.ts';
import { agentTools } from './src/tools/index.ts';

async function test() {
  const result = await generateText({
    model: aiProvider,
    messages: [{ role: 'user', content: 'ls' }],
    tools: agentTools as any,
  });
  console.log(JSON.stringify(result.response.messages, null, 2));
}
test();
