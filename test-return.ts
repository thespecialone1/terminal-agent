import { generateText } from 'ai';
import { aiProvider } from './src/ai/provider.ts';
import { agentTools } from './src/tools/index.ts';

async function test() {
  const history = [
    { role: 'user' as const, content: 'ls' }
  ];

  try {
    const result = await generateText({
      model: aiProvider,
      messages: history,
      tools: agentTools,
    });
    console.log("Returned messages:", JSON.stringify(result.response.messages, null, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
