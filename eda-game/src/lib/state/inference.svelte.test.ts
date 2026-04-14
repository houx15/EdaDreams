import { describe, it, expect, beforeEach } from 'vitest';
import { inferenceState } from './inference.svelte';
import type { InferenceResult } from '$lib/engine/types';

describe('InferenceManager', () => {
  beforeEach(() => {
    inferenceState.clearHistory();
  });

  describe('initial state', () => {
    it('given a fresh inference state, when reading history, then it is empty', () => {
      expect(inferenceState.history).toEqual([]);
    });

    it('given a fresh inference state, when reading latestResult, then it is null', () => {
      expect(inferenceState.latestResult).toBeNull();
    });
  });

  describe('addResult', () => {
    it('given empty history, when adding a result, then history contains that result', () => {
      const result: InferenceResult = {
        grade: 'A',
        output: 'Complete analysis',
        triggeredUnlock: true,
        unlockedEvidence: 'case01_02_domain_registration',
        timestamp: Date.now(),
      };
      inferenceState.addResult(result);
      expect(inferenceState.history.length).toBe(1);
      expect(inferenceState.history[0]).toEqual(result);
    });

    it('given existing history, when adding another result, then latestResult returns the last one', () => {
      const first: InferenceResult = {
        grade: 'C',
        output: 'Insufficient context',
        triggeredUnlock: false,
        timestamp: 1000,
      };
      const second: InferenceResult = {
        grade: 'A',
        output: 'Full analysis',
        triggeredUnlock: true,
        unlockedEvidence: 'next_evidence',
        timestamp: 2000,
      };
      inferenceState.addResult(first);
      inferenceState.addResult(second);
      expect(inferenceState.latestResult).toEqual(second);
    });

    it('given multiple results, when reading history length, then it equals the count added', () => {
      for (let i = 0; i < 5; i++) {
        inferenceState.addResult({
          grade: 'B',
          output: `Partial ${i}`,
          triggeredUnlock: false,
          timestamp: i * 1000,
        });
      }
      expect(inferenceState.history.length).toBe(5);
    });
  });

  describe('clearHistory', () => {
    it('given non-empty history, when clearing, then history is empty and latestResult is null', () => {
      inferenceState.addResult({
        grade: 'A',
        output: 'test',
        triggeredUnlock: false,
        timestamp: Date.now(),
      });
      inferenceState.clearHistory();
      expect(inferenceState.history).toEqual([]);
      expect(inferenceState.latestResult).toBeNull();
    });
  });
});
