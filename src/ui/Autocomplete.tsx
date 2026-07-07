import React from 'react';
import { Box, Text } from 'ink';
import { theme } from './theme.ts';

// Placeholder for future Phase 8 (fuzzysort palette)
export const Autocomplete: React.FC<{ query: string }> = ({ query }) => {
  if (!query.startsWith('/')) return null;
  
  return (
    <Box borderStyle="single" borderColor="gray" paddingX={1} marginBottom={1}>
      <Text color="gray">Autocomplete suggestions for: </Text>
      <Text color={theme.colors.plan}>{query}</Text>
    </Box>
  );
};
