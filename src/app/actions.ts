export type AppAction =
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SUBMIT_INPUT' }
  | { type: 'SET_RUNNING'; payload: { sessionId: string; isRunning: boolean } }
  | { type: 'RECEIVE_RESPONSE'; payload: string }
  | { type: 'ADD_MESSAGE'; payload: { id: string; role: 'user' | 'assistant'; content: string } }
  | { type: 'ADD_CORE_MESSAGES'; payload: { sessionId: string; messages: any[] } }
  | { type: 'REQUIRE_CONFIRMATION'; payload: { prompt: string; toolCalls: any[]; sessionId: string } }
  | { type: 'CONFIRM' }
  | { type: 'CANCEL_CONFIRM' }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_PROVIDER'; payload: string }
  | { type: 'SET_MODE'; payload: 'agent' | 'terminal' }
  | { type: 'SET_VARIANT'; payload: string }
  | { type: 'TOGGLE_PROVIDER_MENU'; payload: boolean }
  | { type: 'START_THINKING'; payload: { sessionId: string } }
  | { type: 'APPEND_THOUGHT'; payload: { sessionId: string, text: string } }
  | { type: 'STOP_THINKING'; payload: { sessionId: string, timeMs: number } }
  | { type: 'APPEND_RESPONSE'; payload: { sessionId: string, text: string } }
  | { type: 'TOGGLE_THOUGHT_VISIBILITY' }
  | { type: 'RESET_STREAM_STATE'; payload: { sessionId: string } }
  | { type: 'CREATE_SESSION'; payload: { id?: string, name: string } }
  | { type: 'SWITCH_SESSION'; payload: string }
  | { type: 'TOGGLE_SESSION_MENU'; payload: boolean }
  | { type: 'SCROLL_UP'; payload: number }
  | { type: 'SCROLL_DOWN'; payload: number };
