import { expect, test, describe } from 'bun:test';
import { appReducer } from './reducer.ts';
import { initialState } from './state.ts';

describe('App Reducer', () => {
  test('SET_MODE updates the activeMode', () => {
    const nextState = appReducer(initialState, { type: 'SET_MODE', payload: 'terminal' });
    expect(nextState.activeMode).toBe('terminal');
  });

  test('TOGGLE_PROVIDER_MENU updates isProviderMenuOpen', () => {
    const nextState = appReducer(initialState, { type: 'TOGGLE_PROVIDER_MENU', payload: true });
    expect(nextState.isProviderMenuOpen).toBe(true);
  });

  test('SET_VARIANT updates activeVariant', () => {
    const nextState = appReducer(initialState, { type: 'SET_VARIANT', payload: 'gpt-4o' });
    expect(nextState.activeVariant).toBe('gpt-4o');
  });

  test('ADD_CORE_MESSAGES appends messages', () => {
    const message = { role: 'user', content: 'hello' } as any;
    const nextState = appReducer(initialState, { type: 'ADD_CORE_MESSAGES', payload: [message] });
    expect(nextState.messages).toHaveLength(1);
    expect(nextState.messages[0].content).toBe('hello');
  });

  test('CLEAR_MESSAGES empties the messages array', () => {
    const populatedState = { ...initialState, messages: [{ role: 'user', content: 'test' } as any] };
    const nextState = appReducer(populatedState, { type: 'CLEAR_MESSAGES' });
    expect(nextState.messages).toHaveLength(0);
  });
});
