import type { AppState, Session } from './state.ts';
import { initialState } from './state.ts';
import type { AppAction } from './actions.ts';
import { generateId } from 'ai';

export function appReducer(state: AppState = initialState, action: AppAction): AppState {
  
  // Helper to update the active session
  const updateActiveSession = (updater: (session: Session) => Partial<Session>): AppState => {
    return {
      ...state,
      sessions: state.sessions.map(s => 
        s.id === state.activeSessionId ? { ...s, ...updater(s) } : s
      )
    };
  };

  const updateSession = (id: string, updater: (session: Session) => Partial<Session>): AppState => {
    return {
      ...state,
      sessions: state.sessions.map(s => 
        s.id === id ? { ...s, ...updater(s) } : s
      )
    };
  };

  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    
    case 'CREATE_SESSION':
      const newSession: Session = {
        id: action.payload.id || generateId(),
        name: action.payload.name,
        messages: [],
        isThinking: false,
        thoughtProcess: '',
        thoughtTimeMs: null,
        currentResponse: '',
        isRunning: false,
        pendingToolCalls: null,
        scrollOffset: 0,
        isConfirming: false,
        confirmPrompt: null,
        approvedTier2Tools: [],
        executingTool: null,
      };
      return {
        ...state,
        sessions: [...state.sessions, newSession],
        activeSessionId: newSession.id,
      };
      
    case 'SCROLL_UP':
      return updateActiveSession(s => ({
        scrollOffset: Math.max(0, s.scrollOffset - action.payload)
      }));

    case 'SCROLL_DOWN':
      return updateActiveSession(s => ({
        scrollOffset: s.scrollOffset + action.payload
      }));

    case 'SET_EXECUTING_TOOL':
      return updateSession(action.payload.sessionId, s => ({
        executingTool: action.payload.toolName
      }));

    case 'TOGGLE_THOUGHT_VISIBILITY':
      return {
        ...state,
        showThoughts: !state.showThoughts,
      };

    case 'TOGGLE_SESSION_MENU':
      return {
        ...state,
        isSessionMenuOpen: action.payload,
      };
      
    case 'SWITCH_SESSION':
      return {
        ...state,
        activeSessionId: action.payload,
        isSessionMenuOpen: false,
      };

    case 'SUBMIT_INPUT':
      if (!state.input.trim()) return state;
      return {
        ...updateActiveSession(s => ({
          messages: [...s.messages, { role: 'user', content: state.input }]
        })),
        input: '',
      };

    case 'SET_RUNNING':
      return updateSession(action.payload.sessionId, () => ({
        isRunning: action.payload.isRunning,
      }));

    case 'RECEIVE_RESPONSE':
      return updateActiveSession(s => ({
        isRunning: false,
        messages: [...s.messages, { role: 'assistant', content: action.payload }],
      }));

    case 'ADD_MESSAGE':
      return updateActiveSession(s => ({
        messages: [...s.messages, { role: action.payload.role, content: action.payload.content }],
      }));

    case 'ADD_CORE_MESSAGES':
      return updateSession(action.payload.sessionId, s => ({
        messages: [...s.messages, ...action.payload.messages],
      }));

    case 'REQUIRE_CONFIRMATION':
      return updateSession(action.payload.sessionId, () => ({
        pendingToolCalls: action.payload.toolCalls,
        isConfirming: true,
        confirmPrompt: action.payload.prompt,
      }));
      
    case 'CONFIRM':
      return updateActiveSession(s => ({
        isConfirming: false,
        confirmPrompt: null,
        // Mark these tools as approved for this session
        approvedTier2Tools: [
          ...s.approvedTier2Tools, 
          ...(s.pendingToolCalls || []).map((tc: any) => tc.toolName)
        ]
      }));

    case 'CANCEL_CONFIRM':
      return updateActiveSession(() => ({
        isConfirming: false,
        confirmPrompt: null,
        pendingToolCalls: null,
        isRunning: false
      }));

    case 'SET_PROVIDER':
      return { ...state, activeProvider: action.payload };
    case 'SET_MODE':
      return { ...state, activeMode: action.payload };
    case 'SET_VARIANT':
      return { ...state, activeVariant: action.payload };
    case 'TOGGLE_PROVIDER_MENU':
      return { ...state, isProviderMenuOpen: action.payload };

    case 'CLEAR_MESSAGES':
      return {
        ...updateActiveSession(() => ({
          messages: [],
        })),
        input: '',
      };

    case 'START_THINKING':
      return updateSession(action.payload.sessionId, () => ({
        isThinking: true,
        thoughtProcess: '',
        thoughtTimeMs: null,
      }));

    case 'APPEND_THOUGHT':
      return updateSession(action.payload.sessionId, s => ({
        thoughtProcess: s.thoughtProcess + action.payload.text,
      }));

    case 'STOP_THINKING':
      return updateSession(action.payload.sessionId, () => ({
        isThinking: false,
        thoughtTimeMs: action.payload.timeMs,
      }));

    case 'APPEND_RESPONSE':
      return updateSession(action.payload.sessionId, s => ({
        currentResponse: s.currentResponse + action.payload.text,
      }));

    case 'TOGGLE_THOUGHT_VISIBILITY':
      return state;

    case 'RESET_STREAM_STATE':
      return updateSession(action.payload.sessionId, () => ({
        isThinking: false,
        thoughtProcess: '',
        thoughtTimeMs: null,
        currentResponse: '',
      }));

    default:
      return state;
  }
}
