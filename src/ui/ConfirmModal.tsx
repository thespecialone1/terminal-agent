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
    <Box borderStyle="round" borderColor={theme.colors.confirm} padding={1} flexDirection="column">
      <Text color={theme.colors.confirm} bold>CONFIRMATION REQUIRED</Text>
      <Box marginY={1}>
        <Text>{prompt}</Text>
      </Box>
      <Text dimColor>(y/enter to confirm, n/esc to cancel)</Text>
    </Box>
  );
};
