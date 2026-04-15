import { describe, it, expect, beforeEach } from 'vitest';
import { evidenceManagerV2 } from './evidence-v2.svelte';

describe('EvidenceManagerV2', () => {
  beforeEach(() => {
    evidenceManagerV2.reset();
  });

  describe('initial state', () => {
    it('given fresh manager, when reading all, then returns empty array', () => {
      expect(evidenceManagerV2.getAll()).toEqual([]);
    });

    it('given fresh manager, when checking unlocked, then returns false', () => {
      expect(evidenceManagerV2.isUnlocked('x')).toBe(false);
    });
  });

  describe('unlock', () => {
    it('given no items, when unlocking, then item appears in all', () => {
      evidenceManagerV2.unlock({ id: 'a', filename: 'a.txt', displayName: 'a.txt', source: { type: 'memo' }, sizeLabel: '1 KB', tokenEstimate: 100, percentageEstimate: 1 });
      expect(evidenceManagerV2.getAll().length).toBe(1);
      expect(evidenceManagerV2.isUnlocked('a')).toBe(true);
    });

    it('given duplicate unlock, when unlocking same id, then array length stays 1', () => {
      const item = { id: 'a', filename: 'a.txt', displayName: 'a.txt', source: { type: 'memo' }, sizeLabel: '1 KB', tokenEstimate: 100, percentageEstimate: 1 };
      evidenceManagerV2.unlock(item);
      evidenceManagerV2.unlock(item);
      expect(evidenceManagerV2.getAll().length).toBe(1);
    });

    it('given unlocked item, when reading all, then contains unlockedAt timestamp', () => {
      const before = Date.now();
      evidenceManagerV2.unlock({ id: 'a', filename: 'a.txt', displayName: 'a.txt', source: { type: 'memo' }, sizeLabel: '1 KB', tokenEstimate: 100, percentageEstimate: 1 });
      const after = Date.now();
      const unlockedAt = evidenceManagerV2.getAll()[0].unlockedAt;
      expect(unlockedAt).toBeGreaterThanOrEqual(before);
      expect(unlockedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('getBySourceType', () => {
    it('given mixed sources, when filtering by tool, then returns only tool items', () => {
      evidenceManagerV2.unlock({ id: 'a', filename: 'a.txt', displayName: 'a.txt', source: { type: 'memo' }, sizeLabel: '1 KB', tokenEstimate: 100, percentageEstimate: 1 });
      evidenceManagerV2.unlock({ id: 'b', filename: 'b.txt', displayName: 'b.txt', source: { type: 'tool', toolId: 'whois', query: 'x' }, sizeLabel: '1 KB', tokenEstimate: 100, percentageEstimate: 1 });
      const tools = evidenceManagerV2.getBySourceType('tool');
      expect(tools.length).toBe(1);
      expect(tools[0].id).toBe('b');
    });
  });

  describe('getToolResults', () => {
    it('given multiple tools, when filtering by whois, then returns only whois items', () => {
      evidenceManagerV2.unlock({ id: 'w', filename: 'w.txt', displayName: 'w.txt', source: { type: 'tool', toolId: 'whois', query: 'x' }, sizeLabel: '1 KB', tokenEstimate: 100, percentageEstimate: 1 });
      evidenceManagerV2.unlock({ id: 'g', filename: 'g.txt', displayName: 'g.txt', source: { type: 'tool', toolId: 'gsxt', query: 'y' }, sizeLabel: '1 KB', tokenEstimate: 100, percentageEstimate: 1 });
      expect(evidenceManagerV2.getToolResults('whois').length).toBe(1);
      expect(evidenceManagerV2.getToolResults('gsxt').length).toBe(1);
      expect(evidenceManagerV2.getToolResults().length).toBe(2);
    });
  });

  describe('reset', () => {
    it('given items exist, when reset, then array is empty', () => {
      evidenceManagerV2.unlock({ id: 'a', filename: 'a.txt', displayName: 'a.txt', source: { type: 'memo' }, sizeLabel: '1 KB', tokenEstimate: 100, percentageEstimate: 1 });
      evidenceManagerV2.reset();
      expect(evidenceManagerV2.getAll()).toEqual([]);
    });
  });
});
