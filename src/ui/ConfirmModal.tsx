import React from 'react';
import { Box, Text, useInput } from 'ink';
import { theme } from './theme.ts';

interface ConfirmModalProps {
  prompt: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ prompt, onConfirm, onCancel }) => {
  const handled = React.useRef(false);
  
  useInput((input, key) => {
    if (handled.current) return;
    
    if (input.toLowerCase() === 'y' || key.return) {
      handled.current = true;
      onConfirm();
    } else if (input.toLowerCase() === 'n' || key.escape) {
      handled.current = true;
      onCancel();
    }
  });

  return (
    <Box flexDirection="row" paddingY={0} paddingX={1}>
      <Text color="yellow" bold>⚠️  CONFIRMATION REQUIRED: </Text>
      <Text>{prompt}</Text>
    </Box>
  );
};
