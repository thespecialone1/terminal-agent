import React, { useState } from 'react';
import { render, useInput, Text } from 'ink';

const App = () => {
  const [count, setCount] = useState(0);
  const [handled, setHandled] = useState(false);

  useInput((input, key) => {
    if (handled) return;
    if (input === 'y') {
      setHandled(true);
      setCount(c => c + 1);
    }
  });

  return React.createElement(Text, null, `Count: ${count}`);
};

const { waitUntilExit } = render(React.createElement(App));
setTimeout(() => process.exit(0), 1000);
