import { describe, it, expect, beforeEach } from 'vitest';
import { achievementState } from './achievements.svelte';

describe('AchievementManager', () => {
  beforeEach(() => {
    achievementState.reset();
  });

  describe('initial state', () => {
    it('given fresh state, when reading unlocked, then returns empty array', () => {
      expect(achievementState.unlocked).toEqual([]);
    });

    it('given fresh state, when checking isUnlocked, then returns false', () => {
      expect(achievementState.isUnlocked('escape_artist')).toBe(false);
    });
  });

  describe('unlock', () => {
    it('given no achievements, when unlocking escape_artist, then it appears in unlocked', () => {
      achievementState.unlock('escape_artist');
      expect(achievementState.unlocked).toContain('escape_artist');
    });

    it('given already unlocked, when unlocking same achievement again, then it is not duplicated', () => {
      achievementState.unlock('escape_artist');
      achievementState.unlock('escape_artist');
      expect(achievementState.unlocked).toEqual(['escape_artist']);
    });

    it('given multiple achievements, when unlocking both, then both appear in unlocked', () => {
      achievementState.unlock('escape_artist');
      achievementState.unlock('another');
      expect(achievementState.unlocked).toEqual(['escape_artist', 'another']);
    });
  });

  describe('getDisplayName', () => {
    it('given escape_artist, when getting display name, then returns 逃出生天', () => {
      expect(achievementState.getDisplayName('escape_artist')).toBe('逃出生天');
    });

    it('given unknown achievement, when getting display name, then returns the raw id', () => {
      expect(achievementState.getDisplayName('unknown')).toBe('unknown');
    });
  });
});
