import React, { useReducer } from 'react';
import { render, Box, Text, Static, useInput } from 'ink';
import Spinner from 'ink-spinner';
import { appReducer } from './app/reducer.ts';
import { initialState } from './app/state.ts';
import { InputBar } from './ui/InputBar.tsx';
import { Autocomplete } from './ui/Autocomplete.tsx';
import { ConfirmModal } from './ui/ConfirmModal.tsx';
import { ProviderMenu } from './ui/ProviderMenu.tsx';
import { getSavedProvider, getSavedVariant } from './app/config.ts';
import { theme } from './ui/theme.ts';
import { streamChatResponse } from './ai/chat.ts';
import { executePendingTool } from './tools/index.ts';
import { highlight } from 'cli-highlight';
import { saveMessage, loadSession, clearSession } from './database.ts';
import { useStdoutDimensions } from './ui/useStdoutDimensions.ts';

import fs from 'fs';
import path from 'path';

// Add a quick visual indicator to messages
const MessageView = ({ msg, i }: { msg: any; i: number }) => {
  const parts = Array.isArray(msg.content) ? msg.content : [{ type: 'text', text: msg.content }];
  return (
    <Box key={i} flexDirection="row" marginBottom={1} flexShrink={0} width="100%">
      <Box width={10} flexShrink={0}>
        <Text color={msg.role === 'user' ? theme.colors.userPrompt : theme.colors.agentResponse} bold>
          {msg.role === 'user' ? 'You:' : msg.role === 'tool' ? 'System:' : 'Agent:'}
        </Text>
      </Box>
      <Box flexGrow={1} flexDirection="column" width="100%">
        {parts.map((part: any, pIdx: number) => {
          if (part.type === 'text' && part.text?.trim()) {
            return (
              <Box key={pIdx} width="100%">
                <Text color={msg.role === 'user' ? 'white' : 'cyanBright'} wrap="wrap">
                  {part.text}
                </Text>
              </Box>
            );
          } else if (part.type === 'tool-call') {
            return (
              <Box key={pIdx} borderStyle="round" borderColor="yellow" paddingX={1} marginTop={1} width="100%">
                <Text color="yellow" wrap="wrap">
                  ⚡ Running: {part.toolName} {JSON.stringify(part.args || {})}
                </Text>
              </Box>
            );
          } else if (part.type === 'tool-result') {
            const resVal = part.result !== undefined ? part.result : (part.output?.value || part.output);
            const resultStr = typeof resVal === 'string' ? resVal : JSON.stringify(resVal);
            return (
              <Box key={pIdx} borderStyle="round" borderColor="gray" paddingX={1} marginTop={1} width="100%">
                <Text dimColor wrap="wrap">
                  {resultStr.slice(0, 1000)}{resultStr.length > 1000 ? '\n...[truncated]' : ''}
                </Text>
              </Box>
            );
          }
          return null;
        })}
      </Box>
    </Box>
  );
};

const App = () => {
  const [state, dispatch] = useReducer(appReducer, {
    ...initialState,
    activeProvider: getSavedProvider(),
    activeVariant: getSavedVariant(),
  });
  
  // Load initial session if needed
  React.useEffect(() => {
    const loaded = loadSession(state.activeSessionId);
    if (loaded && loaded.length > 0) {
      dispatch({ type: 'ADD_CORE_MESSAGES', payload: { sessionId: state.activeSessionId, messages: loaded } });
    }
  }, []);

  const activeSession = (state.sessions.find(s => s.id === state.activeSessionId) || state.sessions[0])!;
  const isRunningRef = React.useRef(activeSession.isRunning);
  const lastCtrlTime = React.useRef(0);
  
  useInput((input, key) => {
    if (key.ctrl) {
      lastCtrlTime.current = Date.now();
    }
    
    if (key.ctrl && input === 'o' && !state.isProviderMenuOpen) {
      dispatch({ type: 'SET_MODE', payload: state.activeMode === 'agent' ? 'terminal' : 'agent' });
    }
    if (key.ctrl && input === 'p') {
      dispatch({ type: 'TOGGLE_PROVIDER_MENU', payload: !state.isProviderMenuOpen });
    }
    if (key.ctrl && input === 'h') {
      dispatch({ type: 'TOGGLE_THOUGHT_VISIBILITY' });
    }
    if (key.ctrl && input === 'n') {
      dispatch({ type: 'CREATE_SESSION', payload: { name: `Session ${state.sessions.length + 1}` } });
    }
    if (key.ctrl && input === 't') {
      dispatch({ type: 'TOGGLE_SESSION_MENU', payload: !state.isSessionMenuOpen });
    }
    if (key.ctrl && key.upArrow) {
      const idx = state.sessions.findIndex(s => s.id === state.activeSessionId);
      if (idx > 0) dispatch({ type: 'SWITCH_SESSION', payload: state.sessions[idx - 1]!.id });
    }
    if (key.ctrl && key.downArrow) {
      const idx = state.sessions.findIndex(s => s.id === state.activeSessionId);
      if (idx < state.sessions.length - 1) dispatch({ type: 'SWITCH_SESSION', payload: state.sessions[idx + 1]!.id });
    }
    if (key.tab && state.activeMode === 'terminal' && state.input.startsWith('cd ')) {
      try {
        const queryPath = state.input.slice(3);
        const dirPath = path.dirname(queryPath);
        const baseName = path.basename(queryPath);
        const fullDir = path.resolve(process.cwd(), dirPath);
        
        if (fs.existsSync(fullDir)) {
          const files = fs.readdirSync(fullDir, { withFileTypes: true });
          const matches = files
            .filter(f => f.isDirectory() && f.name.startsWith(baseName))
            .map(f => f.name);
            
          if (matches.length === 1) {
             const completion = path.join(dirPath, matches[0]!);
             dispatch({ type: 'SET_INPUT', payload: `cd ${completion.startsWith('.') ? completion : './' + completion}` });
          } else if (matches.length > 1) {
             // Find common prefix (simplistic for now)
             dispatch({ type: 'SET_INPUT', payload: `cd ${path.join(dirPath, matches[0]!)}` });
          }
        }
      } catch (e) {
        // Ignore autocomplete errors
      }
    }
  });
  
  React.useEffect(() => {
    isRunningRef.current = activeSession.isRunning;
  }, [activeSession.isRunning]);

  const processAIResponse = async (messagesForAi: any[], targetSessionId: string) => {
    dispatch({ type: 'RESET_STREAM_STATE', payload: { sessionId: targetSessionId } });
    dispatch({ type: 'SET_RUNNING', payload: { sessionId: targetSessionId, isRunning: true } });
    
    let thoughtStartTime = performance.now();
    let hasThought = false;
    let isInsideThinkTag = false;
    let finalResponseText = '';
    const toolCalls: any[] = [];
    
    try {
      const stream = streamChatResponse(messagesForAi, state.activeProvider, state.activeVariant);
      for await (const part of stream) {
        if ((part as any).type === 'reasoning') {
          if (!hasThought) {
            dispatch({ type: 'START_THINKING', payload: { sessionId: targetSessionId } });
            hasThought = true;
          }
          dispatch({ type: 'APPEND_THOUGHT', payload: { sessionId: targetSessionId, text: (part as any).textDelta || (part as any).text || (part as any).delta || '' } });
        } else if (part.type === 'text-delta') {
          // If we transition from native reasoning to text, stop thinking
          if (hasThought && !isInsideThinkTag) { // removed isThinking check to avoid stale state dependency here
            dispatch({ type: 'STOP_THINKING', payload: { sessionId: targetSessionId, timeMs: Math.round((performance.now() - thoughtStartTime) / 1000) } });
          }
          let text = (part as any).textDelta || (part as any).text || (part as any).delta || '';
          if (text.includes('<think>')) {
            isInsideThinkTag = true;
            if (!hasThought) {
              dispatch({ type: 'START_THINKING', payload: { sessionId: targetSessionId } });
              hasThought = true;
            }
            text = text.replace('<think>', '');
          }
          if (isInsideThinkTag && text.includes('</think>')) {
            isInsideThinkTag = false;
            const [thoughtPart, contentPart] = text.split('</think>');
            dispatch({ type: 'APPEND_THOUGHT', payload: { sessionId: targetSessionId, text: thoughtPart } });
            dispatch({ type: 'STOP_THINKING', payload: { sessionId: targetSessionId, timeMs: Math.round((performance.now() - thoughtStartTime) / 1000) } });
            if (contentPart) {
              dispatch({ type: 'APPEND_RESPONSE', payload: { sessionId: targetSessionId, text: contentPart } });
              finalResponseText += contentPart;
            }
            continue;
          }
          if (isInsideThinkTag) {
            dispatch({ type: 'APPEND_THOUGHT', payload: { sessionId: targetSessionId, text } });
          } else {
            dispatch({ type: 'APPEND_RESPONSE', payload: { sessionId: targetSessionId, text } });
            finalResponseText += text;
          }
        } else if (part.type === 'tool-call') {
          toolCalls.push(part);
        } else if (part.type === 'finish') {
          if (hasThought) {
            dispatch({ type: 'STOP_THINKING', payload: { sessionId: targetSessionId, timeMs: Math.round((performance.now() - thoughtStartTime) / 1000) } });
          }
        }
      }
      
      const newMessages = [];
      let finalContent = finalResponseText;
      if (hasThought) {
        const thoughtTimeS = Math.round((performance.now() - thoughtStartTime) / 1000);
        finalContent = `[Thought for ${thoughtTimeS}s]\n${finalResponseText}`;
      }
      if (finalResponseText || hasThought) {
        newMessages.push({ role: 'assistant', content: finalContent });
      }
      if (toolCalls.length > 0) {
        newMessages.push({ role: 'assistant', content: toolCalls });
      }
      
      newMessages.forEach(msg => saveMessage(targetSessionId, msg.role, msg.content));
      dispatch({ type: 'ADD_CORE_MESSAGES', payload: { sessionId: targetSessionId, messages: newMessages } });

      if (toolCalls && toolCalls.length > 0) {
        let requiresConfirmation = false;
        const toolsRequiringConfirmation: string[] = [];
        
        for (const tc of toolCalls) {
          const args = (tc as any).args || (tc as any).input || {};
          
          if (['read_file', 'list_dir', 'grep', 'change_directory', 'spawn_subagent'].includes(tc.toolName)) {
            continue;
          }
          
          if (tc.toolName === 'execute_command') {
            const cmd = (args.command || '').trim();
            if (/^(git status|git diff|git log|bun test|tsc --noEmit|ls|cat|find|grep)\b/.test(cmd)) {
              continue;
            }
            if (/^(rm -rf|sudo|dd|git push --force)\b/.test(cmd) || cmd.includes('|')) {
              requiresConfirmation = true;
              toolsRequiringConfirmation.push(`\`${cmd}\``);
              continue;
            }
            if (/^(git commit|bun add|npm install|mkdir)\b/.test(cmd)) {
              if (!activeSession.approvedTier2Tools?.includes('execute_command')) {
                requiresConfirmation = true;
                toolsRequiringConfirmation.push(`\`${cmd}\``);
              }
              continue;
            }
            requiresConfirmation = true;
            toolsRequiringConfirmation.push(`\`${cmd}\``);
          } else if (tc.toolName === 'write_file') {
            if (!activeSession.approvedTier2Tools?.includes('write_file')) {
              requiresConfirmation = true;
              toolsRequiringConfirmation.push(`\`write_file\` to ${args.path}`);
            }
          } else {
             requiresConfirmation = true;
             toolsRequiringConfirmation.push(`\`${tc.toolName}\``);
          }
        }

        if (requiresConfirmation) {
          dispatch({ 
            type: 'REQUIRE_CONFIRMATION', 
            payload: { prompt: `Agent wants to execute: ${toolsRequiringConfirmation.join(', ')}. Allow? (y/n)`, toolCalls, sessionId: targetSessionId } 
          });
        } else {
          await executeToolsAndContinue(toolCalls, messagesForAi.concat(newMessages), targetSessionId);
        }
      } else {
        dispatch({ type: 'SET_RUNNING', payload: { sessionId: targetSessionId, isRunning: false } });
      }
    } catch (error) {
      dispatch({ type: 'RECEIVE_RESPONSE', payload: `Error: ${error instanceof Error ? error.message : String(error)}` });
    }
  };

  const executeToolsAndContinue = async (toolCalls: any[], currentHistory: any[], targetSessionId: string) => {
    dispatch({ type: 'SET_RUNNING', payload: { sessionId: targetSessionId, isRunning: true } });
    const toolResults = [];
    
    for (const toolCall of toolCalls) {
      dispatch({ type: 'SET_EXECUTING_TOOL', payload: { sessionId: targetSessionId, toolName: toolCall.toolName } });
      const args = (toolCall as any).args || (toolCall as any).input;
      
      if (toolCall.toolName === 'spawn_subagent') {
        const newSessionId = `subagent-${Date.now()}`;
        dispatch({ type: 'CREATE_SESSION', payload: { id: newSessionId, name: args.task_name || 'Sub-Agent' } });
        const initMsg = { role: 'user' as const, content: args.task_description };
        saveMessage(newSessionId, 'user', args.task_description);
        dispatch({ type: 'ADD_CORE_MESSAGES', payload: { sessionId: newSessionId, messages: [initMsg] } });
        
        // Start background execution for the sub-agent
        processAIResponse([initMsg], newSessionId).then(() => {
          const msg = { role: 'assistant' as const, content: `Sub-agent '${args.task_name}' has completed.` };
          saveMessage(targetSessionId, 'assistant', msg.content);
          dispatch({ type: 'ADD_CORE_MESSAGES', payload: { sessionId: targetSessionId, messages: [msg] } });
        }).catch((e) => {
          const msg = { role: 'assistant' as const, content: `Sub-agent '${args.task_name}' failed: ${e.message}` };
          saveMessage(targetSessionId, 'assistant', msg.content);
          dispatch({ type: 'ADD_CORE_MESSAGES', payload: { sessionId: targetSessionId, messages: [msg] } });
        });
        
        toolResults.push({
          type: 'tool-result',
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          result: `Sub-agent spawned in session ${args.task_name}. Use Ctrl+T to view it.`,
        });
      } else {
        const result = await executePendingTool(toolCall.toolName, args);
        const resultStr = String(result);
        const truncatedResult = resultStr.length > 4000 
          ? resultStr.slice(0, 4000) + '\n...[truncated due to length]' 
          : resultStr;
          
        toolResults.push({
          type: 'tool-result',
          toolCallId: toolCall.toolCallId,
          toolName: toolCall.toolName,
          result: truncatedResult,
        });
      }
      dispatch({ type: 'SET_EXECUTING_TOOL', payload: { sessionId: targetSessionId, toolName: null } });
    }

    const toolMessage = { role: 'tool' as const, content: toolResults };
    saveMessage(targetSessionId, 'tool', toolResults);
    dispatch({ type: 'ADD_CORE_MESSAGES', payload: { sessionId: targetSessionId, messages: [toolMessage] } });
    await processAIResponse([...currentHistory, toolMessage], targetSessionId);
  };

  const handleSubmit = async () => {
    if (isRunningRef.current) return;
    const currentInput = state.input;
    if (!currentInput.trim()) return;
    
    if (currentInput.trim() === '/clear') {
      clearSession(state.activeSessionId);
      dispatch({ type: 'CLEAR_MESSAGES' });
      return;
    }

    if (currentInput.trim().startsWith('/mode ')) {
      const parts = currentInput.trim().split(' ');
      const newMode = parts[1] as 'agent' | 'terminal';
      if (['agent', 'terminal'].includes(newMode)) {
        dispatch({ type: 'SET_MODE', payload: newMode });
        dispatch({ type: 'SET_INPUT', payload: '' });
      }
      return;
    }

    if (currentInput.trim().startsWith('/models ')) {
      const parts = currentInput.trim().split(' ');
      const newProvider = parts[1] as 'deepseek' | 'openai' | 'anthropic';
      if (['deepseek', 'openai', 'anthropic'].includes(newProvider)) {
        dispatch({ type: 'SET_PROVIDER', payload: newProvider });
        dispatch({ type: 'SET_INPUT', payload: '' });
      }
      return;
    }

    if (currentInput.trim().startsWith('/session ')) {
      const parts = currentInput.trim().split(' ');
      const num = parseInt(parts[1] || '', 10);
      if (!isNaN(num) && num > 0 && num <= state.sessions.length) {
        dispatch({ type: 'SWITCH_SESSION', payload: state.sessions[num - 1]!.id });
        dispatch({ type: 'SET_INPUT', payload: '' });
      }
      return;
    }

    dispatch({ type: 'SUBMIT_INPUT' });
    saveMessage(state.activeSessionId, 'user', currentInput);
    
    if (state.activeMode === 'terminal') {
      dispatch({ type: 'SET_RUNNING', payload: { sessionId: state.activeSessionId, isRunning: true } });
      const result = await executePendingTool('execute_command', { command: currentInput });
      const responseContent = String(result);
      
      const dummyId = `cmd-${Date.now()}`;
      const toolContent = [{ type: 'tool-result', toolCallId: dummyId, toolName: 'execute_command', result: responseContent }];
      const toolMessage = { role: 'tool' as const, content: toolContent };
      saveMessage(state.activeSessionId, 'tool', toolContent);
      dispatch({ type: 'ADD_CORE_MESSAGES', payload: { sessionId: state.activeSessionId, messages: [toolMessage] } });
      dispatch({ type: 'SET_RUNNING', payload: { sessionId: state.activeSessionId, isRunning: false } });
    } else {
      const messagesForAi = [
        ...activeSession.messages, 
        { role: 'user' as const, content: currentInput }
      ];
      await processAIResponse(messagesForAi, state.activeSessionId);
    }
  };

  const [columns, rows] = useStdoutDimensions();

  // Reverse messages for bottom-up layout, apply scroll offset
  const displayMessages = [...activeSession.messages]
    .reverse()
    .slice(activeSession.scrollOffset);

  return (
    <Box width={columns} height={rows} flexDirection="column">
      {/* Header Pane */}
      <Box 
        borderStyle="single" 
        borderColor={theme.colors.plan}
        paddingX={1}
        flexDirection="row"
        justifyContent="space-between"
      >
        <Box flexDirection="row">
          <Text bold color={theme.colors.plan}>Terminal Agent [{activeSession.name}]</Text>
          <Text color="cyanBright"> | Mode: </Text>
          <Text color={state.activeMode === 'terminal' ? 'green' : 'magenta'} bold>{state.activeMode.toUpperCase()}</Text>
        </Box>
        <Text color="white">Provider: {state.activeProvider}</Text>
      </Box>

      {/* Message List (Scrollable) */}
      <Box flexGrow={1} flexDirection="column-reverse" overflow="hidden" paddingX={1}>
        {displayMessages.map((msg: any, idx: number) => {
          const keyId = msg.id ? String(msg.id) : String(idx);
          return (
            <Box key={`msg-${keyId}`} flexDirection="column" marginBottom={1}>
              <MessageView msg={msg} i={idx} />
            </Box>
          );
        })}
        {displayMessages.length === 0 && (
           <Box flexGrow={1} justifyContent="center" alignItems="center">
              <Text dimColor>No messages in this session yet.</Text>
           </Box>
        )}
      </Box>

      {/* Session Menu Popup */}
      {state.isSessionMenuOpen && (
         <Box borderStyle="round" borderColor="blue" paddingX={1} flexDirection="column" marginBottom={0}>
           <Text color="blue" bold>Select Session (Current: {activeSession.name})</Text>
           {state.sessions.map((s, i) => (
              <Text key={s.id} color={s.id === state.activeSessionId ? 'green' : 'gray'}>
                {i + 1}. {s.name} {s.isRunning ? '(Running...)' : ''}
              </Text>
           ))}
           <Text dimColor>Type /session &lt;num&gt; to switch. Use Ctrl+T to toggle this menu.</Text>
         </Box>
      )}

      {/* Footer / Input Pane */}
      <Box 
        borderStyle="single" 
        borderColor="gray" 
        paddingX={1} 
        flexDirection="column"
      >
        {activeSession.isConfirming && activeSession.confirmPrompt ? (
            <ConfirmModal 
            prompt={activeSession.confirmPrompt}
            onConfirm={async () => {
              dispatch({ type: 'CONFIRM' });
              if (activeSession.pendingToolCalls) {
                await executeToolsAndContinue(activeSession.pendingToolCalls, activeSession.messages, state.activeSessionId);
              }
            }}
            onCancel={async () => {
              dispatch({ type: 'CANCEL_CONFIRM' });
              if (activeSession.pendingToolCalls) {
                const toolResults: any[] = [];
                activeSession.pendingToolCalls.forEach((tc: any) => {
                  toolResults.push({
                    type: 'tool-result',
                    toolCallId: tc.toolCallId,
                    toolName: tc.toolName,
                    result: 'User denied execution of this tool.',
                  });
                });
                const toolMessage = { role: 'tool' as const, content: toolResults };
                saveMessage(state.activeSessionId, 'tool', toolResults);
                dispatch({ type: 'ADD_CORE_MESSAGES', payload: { sessionId: state.activeSessionId, messages: [toolMessage] } });
                await processAIResponse([...activeSession.messages, toolMessage], state.activeSessionId);
              }
            }}
          />
        ) : (
          <Box flexDirection="column">
            {state.showThoughts && activeSession.thoughtProcess && (
              <Box paddingLeft={2} borderLeft borderStyle="single" borderColor="gray" marginBottom={1}>
                <Text dimColor>{activeSession.thoughtProcess}</Text>
              </Box>
            )}
            {activeSession.isRunning && (
              <Box flexDirection="column" marginBottom={1}>
                {activeSession.isThinking && (
                  <Box flexDirection="row">
                    <Text color="cyan"><Spinner type="boxBounce" /> </Text>
                    <Text color="cyan">Agent is thinking...</Text>
                  </Box>
                )}
                {activeSession.executingTool && (
                  <Box flexDirection="row">
                    <Text color="magenta"><Spinner type="dots8Bit" /> </Text>
                    <Text color="magenta">Agent is executing {activeSession.executingTool}...</Text>
                  </Box>
                )}
                {activeSession.currentResponse && (
                  <Box marginTop={1}>
                    <Text color="gray">{activeSession.currentResponse}</Text>
                  </Box>
                )}
              </Box>
            )}
            <Autocomplete query={state.input} />
            <InputBar 
              value={state.input} 
              onChange={(val) => {
                dispatch({ type: 'SET_INPUT', payload: val });
              }}
              onSubmit={handleSubmit}
              disabled={activeSession.isRunning}
              focus={!state.isProviderMenuOpen}
            />
          </Box>
        )}
        </Box>

        {state.isProviderMenuOpen && (
          <ProviderMenu 
            onComplete={(provider, variant) => {
              dispatch({ type: 'SET_PROVIDER', payload: provider });
              dispatch({ type: 'SET_VARIANT', payload: variant });
              dispatch({ type: 'TOGGLE_PROVIDER_MENU', payload: false });
            }}
            onCancel={() => dispatch({ type: 'TOGGLE_PROVIDER_MENU', payload: false })}
          />
        )}
      </Box>
  );
};

// Start the app
process.stdout.write('\x1b[?1049h');
process.on('exit', () => {
  process.stdout.write('\x1b[?1049l');
});

const { waitUntilExit } = render(<App />);

const interval = setInterval(() => {}, 1 << 30);
await waitUntilExit();
clearInterval(interval);
