const ACHIEVEMENT_NAMES: Record<string, string> = {
  escape_artist: '逃出生天',
};

class AchievementManager {
  unlocked = $state<string[]>([]);

  unlock(id: string): void {
    if (!this.unlocked.includes(id)) {
      this.unlocked = [...this.unlocked, id];
    }
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.includes(id);
  }

  getDisplayName(id: string): string {
    return ACHIEVEMENT_NAMES[id] ?? id;
  }

  reset(): void {
    this.unlocked = [];
  }
}

export const achievementState = new AchievementManager();
