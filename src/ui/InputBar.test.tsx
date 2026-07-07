import React from 'react';
import { expect, test, describe, mock } from 'bun:test';
import { render } from 'ink-testing-library';
import { InputBar } from './InputBar.tsx';

describe('InputBar Component', () => {
  test('renders the input bar correctly when enabled', () => {
    const { lastFrame } = render(
      <InputBar 
        value="test input" 
        onChange={() => {}} 
        onSubmit={() => {}} 
      />
    );
    expect(lastFrame()?.includes('test input')).toBe(true);
  });

  test('renders dim text when disabled', () => {
    const { lastFrame } = render(
      <InputBar 
        value="disabled input" 
        onChange={() => {}} 
        onSubmit={() => {}} 
        disabled={true}
      />
    );
    expect(lastFrame()?.includes('disabled input')).toBe(true);
  });
});
