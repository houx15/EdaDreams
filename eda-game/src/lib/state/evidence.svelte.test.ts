import { describe, it, expect, beforeEach } from 'vitest';
import { evidenceState } from './evidence.svelte';

describe('EvidenceManager', () => {
  beforeEach(() => {
    evidenceState.reset();
  });

  describe('initial state', () => {
    it('given a fresh evidence state, when reading unlockedIds, then it is empty', () => {
      expect(evidenceState.unlockedIds).toEqual([]);
    });

    it('given a fresh evidence state, when reading badgeCount, then it is 0', () => {
      expect(evidenceState.badgeCount).toBe(0);
    });
  });

  describe('unlock', () => {
    it('given no unlocked evidence, when unlocking an id, then unlockedIds contains that id', () => {
      evidenceState.unlock('case01_01_phishing_sample');
      expect(evidenceState.unlockedIds).toContain('case01_01_phishing_sample');
    });

    it('given an already unlocked id, when unlocking same id again, then it is not duplicated', () => {
      evidenceState.unlock('case01_01_phishing_sample');
      evidenceState.unlock('case01_01_phishing_sample');
      expect(evidenceState.unlockedIds).toEqual(['case01_01_phishing_sample']);
    });

    it('given one unlocked id, when unlocking another, then unlockedIds contains both', () => {
      evidenceState.unlock('case01_01_phishing_sample');
      evidenceState.unlock('case01_02_domain_registration');
      expect(evidenceState.unlockedIds).toEqual([
        'case01_01_phishing_sample',
        'case01_02_domain_registration',
      ]);
    });

    it('given multiple unlocks, when reading badgeCount, then it equals the count', () => {
      evidenceState.unlock('case01_01_phishing_sample');
      evidenceState.unlock('case01_02_domain_registration');
      evidenceState.unlock('case01_03_email_account');
      expect(evidenceState.badgeCount).toBe(3);
    });
  });

  describe('isUnlocked', () => {
    it('given an unlocked id, when checking isUnlocked, then it returns true', () => {
      evidenceState.unlock('case01_01_phishing_sample');
      expect(evidenceState.isUnlocked('case01_01_phishing_sample')).toBe(true);
    });

    it('given a locked id, when checking isUnlocked, then it returns false', () => {
      expect(evidenceState.isUnlocked('case01_01_phishing_sample')).toBe(false);
    });
  });

  describe('getUnlockedForCase', () => {
    it('given mixed case evidence, when filtering case 1, then only case 1 evidence returned', () => {
      evidenceState.unlock('case00_briefing');
      evidenceState.unlock('case01_01_phishing_sample');
      evidenceState.unlock('case01_02_domain_registration');
      const result = evidenceState.getUnlockedForCase(1);
      expect(result).toEqual([
        'case01_01_phishing_sample',
        'case01_02_domain_registration',
      ]);
    });

    it('given mixed case evidence, when filtering case 0, then only case 0 evidence returned', () => {
      evidenceState.unlock('case00_briefing');
      evidenceState.unlock('case01_01_phishing_sample');
      const result = evidenceState.getUnlockedForCase(0);
      expect(result).toEqual(['case00_briefing']);
    });
  });
});
