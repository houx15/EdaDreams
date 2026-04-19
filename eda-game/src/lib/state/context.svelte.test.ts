import { describe, it, expect, beforeEach } from 'vitest';
import { contextState } from './context.svelte';

describe('ContextManager', () => {
  beforeEach(() => {
    contextState.reset();
  });

  describe('initial state', () => {
    it('given a fresh context, when reading blocks, then it is empty', () => {
      expect(contextState.blocks).toEqual([]);
    });

    it('given a fresh context, when reading caseMaxTokens, then it is 1500', () => {
      expect(contextState.caseMaxTokens).toBe(1500);
    });

    it('given a fresh context, when reading totalTokens, then it is 0', () => {
      expect(contextState.totalTokens).toBe(0);
    });

    it('given a fresh context, when reading capacityInfo, then percentage is 0 and color is blue', () => {
      const info = contextState.capacityInfo;
      expect(info.percentage).toBe(0);
      expect(info.color).toBe('blue');
      expect(info.overflow).toBe(false);
      expect(info.used).toBe(0);
      expect(info.max).toBe(1500);
    });
  });

  describe('addBlock — token counting', () => {
    it('given ASCII text, when adding a block, then tokenCount equals character count', () => {
      const block = contextState.addBlock('hello world', 'evidence', 'test.txt');
      expect(block).not.toBeNull();
      expect(block!.tokenCount).toBe(11);
    });

    it('given Chinese text, when adding a block, then each Chinese char counts as 2 tokens', () => {
      const block = contextState.addBlock('东海银行', 'evidence');
      expect(block).not.toBeNull();
      expect(block!.tokenCount).toBe(8);
    });

    it('given mixed Chinese and ASCII text, when adding a block, then tokens are counted correctly', () => {
      const block = contextState.addBlock('案件CASE-2041-0001', 'evidence');
      expect(block).not.toBeNull();
      expect(block!.tokenCount).toBe(18);
    });

    it('given text with CJK punctuation, when adding a block, then CJK punctuation counts as 2 tokens', () => {
      const block = contextState.addBlock('你好，世界！', 'evidence');
      expect(block).not.toBeNull();
      expect(block!.tokenCount).toBe(12);
    });
  });

  describe('addBlock — block properties', () => {
    it('given valid text, when adding a block, then block has id, text, source, sourceFile, and createdAt', () => {
      const block = contextState.addBlock('test text', 'evidence', 'file.txt');
      expect(block).not.toBeNull();
      expect(block!.id).toBeTruthy();
      expect(block!.text).toBe('test text');
      expect(block!.source).toBe('evidence');
      expect(block!.sourceFile).toBe('file.txt');
      expect(block!.createdAt).toBeGreaterThan(0);
    });

    it('given valid text without sourceFile, when adding a block, then sourceFile is undefined', () => {
      const block = contextState.addBlock('test text', 'output');
      expect(block).not.toBeNull();
      expect(block!.sourceFile).toBeUndefined();
    });
  });

  describe('canAddBlock', () => {
    it('given empty context, when checking if a small block can be added, then it returns true', () => {
      expect(contextState.canAddBlock('hello world')).toBe(true);
    });

    it('given context near capacity, when checking a block that would fit, then it returns true', () => {
      contextState.addBlock('a'.repeat(1400), 'evidence');
      expect(contextState.canAddBlock('a'.repeat(50))).toBe(true);
    });

    it('given context near capacity, when checking a block that would overflow, then it returns false', () => {
      contextState.addBlock('a'.repeat(1400), 'evidence');
      expect(contextState.canAddBlock('a'.repeat(200))).toBe(false);
    });

    it('given context at exactly 100% capacity, when checking any block, then it returns false', () => {
      contextState.addBlock('a'.repeat(1500), 'evidence');
      expect(contextState.canAddBlock('x')).toBe(false);
    });

    it('given mixed Chinese and ASCII text, when checking capacity, then token count is calculated correctly', () => {
      contextState.addBlock('a'.repeat(1400), 'evidence');
      // '东海银行' = 8 tokens, 1400 + 8 = 1408 <= 1500
      expect(contextState.canAddBlock('东海银行')).toBe(true);
      // 'a'.repeat(200) = 200 tokens, 1400 + 200 = 1600 > 1500
      expect(contextState.canAddBlock('a'.repeat(200))).toBe(false);
    });
  });

  describe('addBlock — capacity and overflow', () => {
    it('given blocks under capacity, when adding a block, then it succeeds and blocks array grows', () => {
      contextState.addBlock('short', 'evidence');
      expect(contextState.blocks.length).toBe(1);
    });

    it('given blocks at exactly 100% capacity, when adding another block, then it returns null', () => {
      const charCount = 1500;
      const text = 'a'.repeat(charCount);
      const first = contextState.addBlock(text, 'evidence');
      expect(first).not.toBeNull();
      const overflow = contextState.addBlock('x', 'evidence');
      expect(overflow).toBeNull();
    });

    it('given a block that would exceed 100% capacity, when adding, then it returns null and blocks unchanged', () => {
      const bigText = 'a'.repeat(1400);
      contextState.addBlock(bigText, 'evidence');
      const tooBig = 'a'.repeat(200);
      const result = contextState.addBlock(tooBig, 'evidence');
      expect(result).toBeNull();
      expect(contextState.blocks.length).toBe(1);
    });

    it('given blocks near capacity, when adding a small block that fits, then it succeeds', () => {
      const bigText = 'a'.repeat(1400);
      contextState.addBlock(bigText, 'evidence');
      const small = contextState.addBlock('a'.repeat(50), 'evidence');
      expect(small).not.toBeNull();
      expect(contextState.blocks.length).toBe(2);
    });
  });

  describe('capacityInfo — percentage and color', () => {
    it('given 0% capacity used, when reading capacityInfo, then color is blue', () => {
      expect(contextState.capacityInfo.color).toBe('blue');
    });

    it('given 30% capacity used, when reading capacityInfo, then color is blue', () => {
      const text = 'a'.repeat(450);
      contextState.addBlock(text, 'evidence');
      expect(contextState.capacityInfo.percentage).toBeCloseTo(30, 0);
      expect(contextState.capacityInfo.color).toBe('blue');
    });

    it('given 50% capacity used, when reading capacityInfo, then color is blue (boundary)', () => {
      const text = 'a'.repeat(750);
      contextState.addBlock(text, 'evidence');
      expect(contextState.capacityInfo.percentage).toBe(50);
      expect(contextState.capacityInfo.color).toBe('blue');
    });

    it('given 60% capacity used, when reading capacityInfo, then color is orange', () => {
      const text = 'a'.repeat(900);
      contextState.addBlock(text, 'evidence');
      expect(contextState.capacityInfo.percentage).toBe(60);
      expect(contextState.capacityInfo.color).toBe('orange');
    });

    it('given 80% capacity used, when reading capacityInfo, then color is orange (boundary)', () => {
      const text = 'a'.repeat(1200);
      contextState.addBlock(text, 'evidence');
      expect(contextState.capacityInfo.percentage).toBe(80);
      expect(contextState.capacityInfo.color).toBe('orange');
    });

    it('given 90% capacity used, when reading capacityInfo, then color is red', () => {
      const text = 'a'.repeat(1350);
      contextState.addBlock(text, 'evidence');
      expect(contextState.capacityInfo.percentage).toBe(90);
      expect(contextState.capacityInfo.color).toBe('red');
    });
  });

  describe('removeBlock', () => {
    it('given blocks exist, when removing a block by id, then blocks array shrinks', () => {
      const block = contextState.addBlock('test', 'evidence');
      contextState.removeBlock(block!.id);
      expect(contextState.blocks.length).toBe(0);
    });

    it('given blocks exist, when removing a block, then totalTokens recalculates', () => {
      const block = contextState.addBlock('hello world', 'evidence');
      expect(contextState.totalTokens).toBe(11);
      contextState.removeBlock(block!.id);
      expect(contextState.totalTokens).toBe(0);
    });

    it('given multiple blocks, when removing the middle one, then order is preserved', () => {
      const b1 = contextState.addBlock('aaa', 'evidence');
      contextState.addBlock('bbb', 'evidence');
      const b3 = contextState.addBlock('ccc', 'evidence');
      contextState.removeBlock(b1!.id);
      expect(contextState.blocks.length).toBe(2);
      expect(contextState.blocks.map((b) => b.text)).toEqual(['bbb', 'ccc']);
    });

    it('given a non-existent id, when removing, then nothing changes', () => {
      contextState.addBlock('test', 'evidence');
      contextState.removeBlock('nonexistent');
      expect(contextState.blocks.length).toBe(1);
    });
  });

  describe('clearBlocks', () => {
    it('given multiple blocks, when clearing, then blocks is empty and totalTokens is 0', () => {
      contextState.addBlock('aaa', 'evidence');
      contextState.addBlock('bbb', 'evidence');
      contextState.clearBlocks();
      expect(contextState.blocks).toEqual([]);
      expect(contextState.totalTokens).toBe(0);
    });
  });

  describe('reorderBlock', () => {
    it('given three blocks, when reordering first to last, then order changes', () => {
      const b1 = contextState.addBlock('first', 'evidence');
      contextState.addBlock('second', 'evidence');
      contextState.addBlock('third', 'evidence');
      contextState.reorderBlock(b1!.id, 2);
      expect(contextState.blocks.map((b) => b.text)).toEqual([
        'second',
        'third',
        'first',
      ]);
    });

    it('given three blocks, when reordering last to first, then order changes', () => {
      contextState.addBlock('first', 'evidence');
      contextState.addBlock('second', 'evidence');
      const b3 = contextState.addBlock('third', 'evidence');
      contextState.reorderBlock(b3!.id, 0);
      expect(contextState.blocks.map((b) => b.text)).toEqual([
        'third',
        'first',
        'second',
      ]);
    });
  });

  describe('setCaseMaxTokens', () => {
    it('given caseMaxTokens is 1500, when setting to 10000, then capacity recalculates', () => {
      contextState.addBlock('a'.repeat(500), 'evidence');
      expect(contextState.capacityInfo.percentage).toBeCloseTo(33.33, 1);
      contextState.setCaseMaxTokens(10000);
      expect(contextState.caseMaxTokens).toBe(10000);
      expect(contextState.capacityInfo.percentage).toBe(5);
    });
  });
});
