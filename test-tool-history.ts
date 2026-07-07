import { generateText } from 'ai';
import { aiProvider } from './src/ai/provider.ts';
import { agentTools } from './src/tools/index.ts';

async function test() {
  const history: any[] = [
    { role: 'user', content: 'ls' },
    { 
      role: 'assistant', 
      content: [
        { type: 'tool-call', toolCallId: 'call_1', toolName: 'execute_command', input: { command: 'ls' } }
      ]
    },
    { 
      role: 'tool', 
      content: [
        { type: 'tool-result', toolCallId: 'call_1', toolName: 'execute_command', output: { type: 'text', value: 'file.txt' } }
      ] 
    }
  ];

  try {
    const result = await generateText({
      model: aiProvider,
      messages: history,
      tools: agentTools,
    });
    console.log("Success:", result.text);
  } catch (err) {
    console.error(err);
  }
}

test();
