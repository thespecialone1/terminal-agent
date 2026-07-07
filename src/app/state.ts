import { generateId } from 'ai';

export interface Session {
  id: string;
  name: string;
  messages: any[];
  isThinking: boolean;
  thoughtProcess: string;
  thoughtTimeMs: number | null;
  currentResponse: string;
  isRunning: boolean;
  pendingToolCalls: any[] | null;
  scrollOffset: number;
}

export interface AppState {
  sessions: Session[];
  activeSessionId: string;
  
  // global UI state
  input: string;
  isConfirming: boolean;
  confirmPrompt: string | null;
  activeProvider: string;
  activeMode: 'agent' | 'terminal';
  activeVariant: string;
  isProviderMenuOpen: boolean;
  isSessionMenuOpen: boolean;
  showThoughts: boolean;
}

const defaultSessionId = generateId();

export const initialState: AppState = {
  sessions: [
    {
      id: defaultSessionId,
      name: 'Main Session',
      messages: [],
      isThinking: false,
      thoughtProcess: '',
      thoughtTimeMs: null,
      currentResponse: '',
      isRunning: false,
      pendingToolCalls: null,
      scrollOffset: 0,
    }
  ],
  activeSessionId: defaultSessionId,
  input: '',
  isConfirming: false,
  confirmPrompt: null,
  activeProvider: 'deepseek',
  activeMode: 'agent',
  activeVariant: 'deepseek-chat',
  isProviderMenuOpen: false,
  isSessionMenuOpen: false,
  showThoughts: true,
};
