import React from 'react';
import { Box, Text } from 'ink';
import { theme } from './theme.ts';
import fuzzysort from 'fuzzysort';

const COMMANDS = ['/clear', '/mode agent', '/mode terminal', '/models deepseek', '/models openai', '/models anthropic', '/session'];

export const Autocomplete: React.FC<{ query: string }> = ({ query }) => {
  if (!query.startsWith('/')) return null;
  
  const results = fuzzysort.go(query, COMMANDS);
  if (results.length === 0) return null;

  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} marginBottom={1} flexDirection="column">
      <Text color="gray">Autocomplete suggestions:</Text>
      {results.slice(0, 5).map((res, i) => (
        <Text key={i} color={i === 0 ? theme.colors.plan : 'gray'}>
          {res.target}
        </Text>
      ))}
    </Box>
  );
};
