import type { ContextBlock, CapacityInfo } from '$lib/engine/types';

function countTokens(text: string): number {
  let tokens = 0;
  for (const char of text) {
    const code = char.codePointAt(0)!;
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0x3000 && code <= 0x303F) ||
      (code >= 0xFF00 && code <= 0xFFEF) ||
      (code >= 0xFE30 && code <= 0xFE4F) ||
      (code >= 0x2E80 && code <= 0x2FDF) ||
      (code >= 0x3040 && code <= 0x309F) ||
      (code >= 0x30A0 && code <= 0x30FF)
    ) {
      tokens += 2;
    } else {
      tokens += 1;
    }
  }
  return tokens;
}

let blockCounter = 0;

function createBlock(
  text: string,
  source: 'evidence' | 'output',
  maxTokens: number,
  sourceFile?: string,
): ContextBlock | null {
  const tokenCount = countTokens(text);
  const percentage = (tokenCount / maxTokens) * 100;
  return {
    id: `ctx_${++blockCounter}_${Date.now()}`,
    text,
    source,
    sourceFile,
    tokenCount,
    percentage,
    createdAt: Date.now(),
  };
}

class ContextManager {
  blocks = $state<ContextBlock[]>([]);
  caseMaxTokens = $state<number>(1500);

  addBlock(
    text: string,
    source: 'evidence' | 'output',
    sourceFile?: string,
  ): ContextBlock | null {
    const tokenCount = countTokens(text);
    const currentTotal = this.totalTokens;
    if (currentTotal + tokenCount > this.caseMaxTokens) {
      return null;
    }
    const block = createBlock(text, source, this.caseMaxTokens, sourceFile);
    if (block === null) return null;
    this.blocks = [...this.blocks, block];
    return block;
  }

  removeBlock(id: string): void {
    this.blocks = this.blocks.filter((b) => b.id !== id);
  }

  clearBlocks(): void {
    this.blocks = [];
  }

  reorderBlock(id: string, newIndex: number): void {
    const idx = this.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;
    const updated = [...this.blocks];
    const [removed] = updated.splice(idx, 1);
    updated.splice(newIndex, 0, removed);
    this.blocks = updated;
  }

  get totalTokens(): number {
    return this.blocks.reduce((sum, b) => sum + b.tokenCount, 0);
  }

  get capacityInfo(): CapacityInfo {
    const used = this.totalTokens;
    const max = this.caseMaxTokens;
    const percentage = max > 0 ? (used / max) * 100 : 0;
    const color =
      percentage <= 50 ? 'blue' : percentage <= 80 ? 'orange' : 'red';
    const overflow = percentage > 100;
    return { used, max, percentage, color, overflow };
  }

  setCaseMaxTokens(max: number): void {
    this.caseMaxTokens = max;
  }

  reset(): void {
    this.blocks = [];
    this.caseMaxTokens = 1500;
  }
}

export const contextState = new ContextManager();
