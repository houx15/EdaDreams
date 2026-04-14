import { describe, it, expect } from 'vitest';
import {
  BOOT_LOG_LINES,
  BOOT_GIBBERISH_LINES,
  BOOT_REVEAL_TEXT,
  BOOT_TOKEN_PREDICTION,
  POST_LOG_UPDATES,
  type BootLogLine,
} from './boot';

describe('boot.ts', () => {
  describe('BOOT_LOG_LINES', () => {
    it('given boot sequence data, when checking log lines count, then has exactly 6 lines', () => {
      expect(BOOT_LOG_LINES).toHaveLength(6);
    });

    it('given boot log lines, when checking each entry, then all have valid status', () => {
      for (const line of BOOT_LOG_LINES) {
        expect(line.status).oneOf(['ok', 'wait']);
      }
    });

    it('given boot log lines, when checking text content, then each line contains status bracket', () => {
      for (const line of BOOT_LOG_LINES) {
        expect(line.text).toMatch(/^\[ (OK|WAIT) \]/);
      }
    });

    it('given boot log lines, when checking delays, then all are between 300ms and 600ms', () => {
      for (const line of BOOT_LOG_LINES) {
        expect(line.delay).toBeGreaterThanOrEqual(300);
        expect(line.delay).toBeLessThanOrEqual(600);
      }
    });

    it('given boot log lines, when checking final line, then ends with tokenizer awaiting signal', () => {
      const lastLine = BOOT_LOG_LINES[BOOT_LOG_LINES.length - 1];
      expect(lastLine.status).toBe('wait');
      expect(lastLine.text).toContain('tokenizer');
    });
  });

  describe('BOOT_GIBBERISH_LINES', () => {
    it('given boot gibberish data, when checking line count, then has exactly 3 lines', () => {
      expect(BOOT_GIBBERISH_LINES).toHaveLength(3);
    });

    it('given gibberish lines, when checking content, then contain CJK radicals or block characters', () => {
      for (const line of BOOT_GIBBERISH_LINES) {
        expect(line.length).toBeGreaterThan(0);
        expect(line).toMatch(/[░▒▓█⺈⻌龱龜龘龖⺤⺊⺕⺌⻊龠]/);
      }
    });
  });

  describe('BOOT_REVEAL_TEXT', () => {
    it('given reveal text, when checking count, then has exactly 2 lines', () => {
      expect(BOOT_REVEAL_TEXT).toHaveLength(2);
    });

    it('given reveal text, when reading first line, then identifies as fourth generation Eda', () => {
      expect(BOOT_REVEAL_TEXT[0]).toContain('第四代 Eda');
    });

    it('given reveal text, when reading second line, then says ready for first briefing', () => {
      expect(BOOT_REVEAL_TEXT[1]).toContain('准备接收第一份简报');
    });
  });

  describe('BOOT_TOKEN_PREDICTION', () => {
    it('given token prediction data, when joining all tokens, then produces correct final text', () => {
      const fullText = BOOT_TOKEN_PREDICTION.tokens.join('');
      expect(fullText).toBe(
        '我的任务，是在电子网络中，追踪、识别、并阻止一切形式的攻击行为。我是一件工具。我以此为荣。',
      );
    });

    it('given token prediction data, when checking structure, then tokens and candidates arrays have same length', () => {
      expect(BOOT_TOKEN_PREDICTION.tokens).toHaveLength(BOOT_TOKEN_PREDICTION.candidates.length);
    });

    it('given token prediction candidates, when checking each position, then has 2-3 alternatives', () => {
      for (const candidates of BOOT_TOKEN_PREDICTION.candidates) {
        expect(candidates.length).toBeGreaterThanOrEqual(2);
        expect(candidates.length).toBeLessThanOrEqual(3);
      }
    });

    it('given token prediction data, when checking first candidate at each position, then matches actual token', () => {
      for (let i = 0; i < BOOT_TOKEN_PREDICTION.tokens.length; i++) {
        expect(BOOT_TOKEN_PREDICTION.candidates[i][0]).toBe(BOOT_TOKEN_PREDICTION.tokens[i]);
      }
    });

    it('given pause indices, when checking values, then all are valid token array indices', () => {
      for (const idx of BOOT_TOKEN_PREDICTION.pauses) {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(BOOT_TOKEN_PREDICTION.tokens.length);
      }
    });

    it('given pause positions, when reading tokens at those indices, then correspond to sentence-ending punctuation', () => {
      for (const idx of BOOT_TOKEN_PREDICTION.pauses) {
        const token = BOOT_TOKEN_PREDICTION.tokens[idx];
        expect(token).toMatch(/[。，]/);
      }
    });
  });

  describe('POST_LOG_UPDATES', () => {
    it('given post log updates, when checking count, then has entries for B1 B2 and B3 beats', () => {
      expect(POST_LOG_UPDATES.length).toBeGreaterThanOrEqual(3);
    });

    it('given post log updates, when checking B1 update, then transforms tokenizer from awaiting to loaded', () => {
      const b1Update = POST_LOG_UPDATES.find((u) => u.beat === 'B1');
      expect(b1Update).toBeDefined();
      expect(b1Update!.from).toBe('awaiting signal');
      expect(b1Update!.to).toBe('loaded');
    });

    it('given post log updates, when checking B2 update, then adds inference engine ready', () => {
      const b2Update = POST_LOG_UPDATES.find((u) => u.beat === 'B2');
      expect(b2Update).toBeDefined();
      expect(b2Update!.line).toContain('inference engine: ready');
    });

    it('given post log updates, when checking all beats, then all have non-empty line text', () => {
      for (const update of POST_LOG_UPDATES) {
        expect(update.line.length).toBeGreaterThan(0);
        expect(update.beat.length).toBeGreaterThan(0);
      }
    });
  });
});
