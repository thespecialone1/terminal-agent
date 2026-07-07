import React, { useEffect, useState } from 'react';
import { render, Text, Box, useInput } from 'ink';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const App = () => {
  const [status, setStatus] = useState('Typing mode');
  const [output, setOutput] = useState('');

  useInput((input, key) => {
    if (input === 'r') {
      setStatus('Running command...');
      process.stdin.setRawMode(false);
      process.stdin.pause();

      execAsync('sudo -S echo hi < /dev/tty').then(({ stdout }) => {
        setOutput(stdout);
        setStatus('Finished');
        process.stdin.setRawMode(true);
        process.stdin.resume();
      }).catch((e) => {
        setOutput(e.message);
        setStatus('Finished with error');
        process.stdin.setRawMode(true);
        process.stdin.resume();
      });
    }
    if (input === 'q') {
      process.exit(0);
    }
  });

  return (
    <Box flexDirection="column">
      <Text>Status: {status}</Text>
      <Text>Output: {output}</Text>
      <Text>Press 'r' to run sudo, 'q' to quit.</Text>
    </Box>
  );
};

render(<App />);
