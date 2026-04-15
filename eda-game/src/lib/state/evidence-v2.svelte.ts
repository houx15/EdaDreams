import type { EvidenceItem, EvidenceSource, ToolId } from '$lib/engine/types-v2';

class EvidenceManagerV2 {
  items = $state<EvidenceItem[]>([]);

  unlock(item: EvidenceItem): void {
    if (!this.items.some((i) => i.id === item.id)) {
      this.items = [...this.items, { ...item, unlockedAt: Date.now() }];
    }
  }

  markAsRead(id: string): void {
    this.items = this.items.map((i) => (i.id === id ? { ...i } : i));
  }

  isUnlocked(id: string): boolean {
    return this.items.some((i) => i.id === id);
  }

  getBySourceType(type: EvidenceSource['type']): EvidenceItem[] {
    return this.items.filter((i) => i.source.type === type);
  }

  getToolResults(toolId?: ToolId): EvidenceItem[] {
    return this.items.filter((i) => i.source.type === 'tool' && (!toolId || i.source.toolId === toolId));
  }

  getAll(): EvidenceItem[] {
    return this.items;
  }

  reset(): void {
    this.items = [];
  }
}

export const evidenceManagerV2 = new EvidenceManagerV2();
