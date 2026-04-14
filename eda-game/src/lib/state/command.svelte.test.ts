import { describe, it, expect, beforeEach } from 'vitest';
import { commandState } from './command.svelte';

describe('CommandManager', () => {
  beforeEach(() => {
    commandState.reset();
  });

  describe('initial state', () => {
    it('given a fresh command state, when reading input, then it is empty', () => {
      expect(commandState.input).toBe('');
    });

    it('given a fresh command state, when reading isOpen, then it is false', () => {
      expect(commandState.isOpen).toBe(false);
    });

    it('given a fresh command state, when reading autocompleteItems, then it has default commands', () => {
      expect(commandState.autocompleteItems).toEqual([
        '/help',
        '/status',
        '/clear',
      ]);
    });
  });

  describe('setInput', () => {
    it('given empty input, when setting input to /help, then input is /help', () => {
      commandState.setInput('/help');
      expect(commandState.input).toBe('/help');
    });
  });

  describe('execute', () => {
    it('given input is /exit, when executing, then returns exit', () => {
      commandState.setInput('/exit');
      const result = commandState.execute();
      expect(result).toBe('exit');
    });

    it('given input is /help, when executing, then returns help', () => {
      commandState.setInput('/help');
      const result = commandState.execute();
      expect(result).toBe('help');
    });

    it('given input is /status, when executing, then returns status', () => {
      commandState.setInput('/status');
      const result = commandState.execute();
      expect(result).toBe('status');
    });

    it('given input is /clear, when executing, then returns clear', () => {
      commandState.setInput('/clear');
      const result = commandState.execute();
      expect(result).toBe('clear');
    });

    it('given input is /unknown, when executing, then returns null', () => {
      commandState.setInput('/unknown');
      const result = commandState.execute();
      expect(result).toBeNull();
    });

    it('given input is empty, when executing, then returns null', () => {
      commandState.setInput('');
      const result = commandState.execute();
      expect(result).toBeNull();
    });

    it('given input is /help, when executing, then input is cleared', () => {
      commandState.setInput('/help');
      commandState.execute();
      expect(commandState.input).toBe('');
    });
  });

  describe('reset', () => {
    it('given modified state, when resetting, then all values return to defaults', () => {
      commandState.setInput('/help');
      commandState.isOpen = true;
      commandState.reset();
      expect(commandState.input).toBe('');
      expect(commandState.isOpen).toBe(false);
      expect(commandState.autocompleteItems).toEqual([
        '/help',
        '/status',
        '/clear',
      ]);
    });
  });
});
