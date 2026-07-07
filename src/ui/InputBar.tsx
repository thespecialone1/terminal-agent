import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { theme } from './theme.ts';

interface InputBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  focus?: boolean;
}

export const InputBar: React.FC<InputBarProps> = ({ value, onChange, onSubmit, disabled, focus = true }) => {
  return (
    <Box flexDirection="row">
      <Box marginRight={1}>
        <Text color={theme.colors.terminal} bold>{'>'}</Text>
      </Box>
      {!disabled ? (
        <TextInput 
          value={value} 
          onChange={onChange} 
          onSubmit={onSubmit}
          focus={focus}
        />
      ) : (
        <Text dimColor>{value}</Text>
      )}
    </Box>
  );
};
