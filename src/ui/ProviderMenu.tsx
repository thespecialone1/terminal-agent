import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { getApiKey, saveApiKey, saveActiveProvider, saveActiveVariant } from '../app/config.ts';
import { theme } from './theme.ts';

const PROVIDERS = {
  deepseek: {
    name: 'DeepSeek',
    variants: ['deepseek-chat', 'deepseek-coder'],
  },
  openai: {
    name: 'OpenAI',
    variants: ['gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  },
  anthropic: {
    name: 'Anthropic',
    variants: ['claude-3-5-sonnet-20240620', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
  },
};

type Step = 'PROVIDER' | 'VARIANT' | 'API_KEY';

interface ProviderMenuProps {
  onComplete: (provider: string, variant: string) => void;
  onCancel: () => void;
}

export const ProviderMenu: React.FC<ProviderMenuProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<Step>('PROVIDER');
  const [selectedProviderIndex, setSelectedProviderIndex] = useState(0);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [apiKeyInput, setApiKeyInput] = useState('');

  const providerKeys = Object.keys(PROVIDERS) as Array<keyof typeof PROVIDERS>;
  const activeProviderKey = providerKeys[selectedProviderIndex]!;
  const variants = PROVIDERS[activeProviderKey].variants;

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }

    if (step === 'PROVIDER') {
      if (key.upArrow) {
        setSelectedProviderIndex(Math.max(0, selectedProviderIndex - 1));
      } else if (key.downArrow) {
        setSelectedProviderIndex(Math.min(providerKeys.length - 1, selectedProviderIndex + 1));
      } else if (key.return) {
        setStep('VARIANT');
        setSelectedVariantIndex(0);
      }
    } else if (step === 'VARIANT') {
      if (key.upArrow) {
        setSelectedVariantIndex(Math.max(0, selectedVariantIndex - 1));
      } else if (key.downArrow) {
        setSelectedVariantIndex(Math.min(variants.length - 1, selectedVariantIndex + 1));
      } else if (key.return) {
        const provider = activeProviderKey;
        const variant = variants[selectedVariantIndex];
        
        // Check if API key exists
        const existingKey = getApiKey(provider);
        if (existingKey) {
          saveActiveProvider(provider);
          saveActiveVariant(variant);
          onComplete(provider, variant);
        } else {
          setStep('API_KEY');
        }
      } else if (key.leftArrow || key.backspace || key.delete) {
        // Go back
        setStep('PROVIDER');
      }
    }
  });

  const handleApiKeySubmit = () => {
    if (apiKeyInput.trim()) {
      const provider = activeProviderKey;
      const variant = variants[selectedVariantIndex];
      saveApiKey(provider, apiKeyInput.trim());
      saveActiveProvider(provider);
      saveActiveVariant(variant);
      onComplete(provider, variant);
    }
  };

  return (
    <Box 
      width="100%" 
      height="100%" 
      position="absolute"
      alignItems="center" 
      justifyContent="center"
      flexDirection="column"
    >
      <Box 
        borderStyle="round" 
        borderColor={theme.colors.plan} 
        paddingX={2} 
        paddingY={1}
        flexDirection="column"
        width={60}
        backgroundColor="black"
      >
        <Text bold color={theme.colors.plan} marginBottom={1}>
          Model Selection
        </Text>

        {step === 'PROVIDER' && (
          <Box flexDirection="column">
            <Text color="gray" marginBottom={1}>Select a provider (Up/Down, Enter):</Text>
            {providerKeys.map((pKey, idx) => (
              <Text key={pKey} color={idx === selectedProviderIndex ? 'green' : 'white'}>
                {idx === selectedProviderIndex ? '❯ ' : '  '}
                {PROVIDERS[pKey].name}
              </Text>
            ))}
          </Box>
        )}

        {step === 'VARIANT' && (
          <Box flexDirection="column">
            <Text color="gray" marginBottom={1}>Select {PROVIDERS[activeProviderKey].name} variant:</Text>
            {variants.map((v, idx) => (
              <Text key={v} color={idx === selectedVariantIndex ? 'green' : 'white'}>
                {idx === selectedVariantIndex ? '❯ ' : '  '}
                {v}
              </Text>
            ))}
            <Box marginTop={1}>
              <Text color="gray">(Backspace to go back)</Text>
            </Box>
          </Box>
        )}

        {step === 'API_KEY' && (
          <Box flexDirection="column">
            <Text color="yellow" marginBottom={1}>
              API Key required for {PROVIDERS[activeProviderKey].name}.
            </Text>
            <Box flexDirection="row">
              <Text>Key: </Text>
              <TextInput 
                value={apiKeyInput} 
                onChange={setApiKeyInput} 
                onSubmit={handleApiKeySubmit}
                mask="*"
              />
            </Box>
            <Box marginTop={1}>
              <Text color="gray">(Press Enter to save, Esc to cancel)</Text>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
};
