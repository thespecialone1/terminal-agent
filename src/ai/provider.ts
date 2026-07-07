import { deepseek } from '@ai-sdk/deepseek';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export function getProvider(name: string, variant: string) {
  switch (name) {
    case 'openai':
      return openai(variant || 'gpt-4o');
    case 'anthropic':
      return anthropic(variant || 'claude-3-5-sonnet-latest');
    case 'deepseek':
    default:
      return deepseek(variant || 'deepseek-chat');
  }
}
