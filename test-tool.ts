import { generateText } from 'ai';
import { getProvider } from './src/ai/provider.ts';
import { agentTools } from './src/tools/index.ts';

async function main() {
  const result = await generateText({
    model: getProvider('deepseek'),
    messages: [{ role: 'user', content: 'run ls' }],
    tools: agentTools as any,
  });
  console.log("TOOL CALLS ARRAY:");
  console.log(JSON.stringify(result.toolCalls, null, 2));
  console.log("RESPONSE MESSAGES:");
  console.log(JSON.stringify(result.response.messages, null, 2));
}
main();
