class EvidenceManager {
  unlockedIds = $state<string[]>([]);

  unlock(evidenceId: string): void {
    if (!this.unlockedIds.includes(evidenceId)) {
      this.unlockedIds = [...this.unlockedIds, evidenceId];
    }
  }

  isUnlocked(id: string): boolean {
    return this.unlockedIds.includes(id);
  }

  getUnlockedForCase(caseNum: number): string[] {
    const prefix = `case${String(caseNum).padStart(2, '0')}_`;
    return this.unlockedIds.filter((id) => id.startsWith(prefix));
  }

  get badgeCount(): number {
    return this.unlockedIds.length;
  }

  reset(): void {
    this.unlockedIds = [];
  }
}

export const evidenceState = new EvidenceManager();
