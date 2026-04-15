import type { StateMachineData, LockConfig, LockStateValue } from '$lib/engine/types-v2';

export type UnlockResult =
  | { success: true; lockId: string; response: string }
  | { success: false; lockId: string; reason: string };

export class StateMachine {
  private lockStates = new Map<string, LockStateValue>();
  private data: StateMachineData;

  constructor(data: StateMachineData) {
    this.data = data;
    for (const [lockId, config] of Object.entries(data.locks)) {
      this.lockStates.set(lockId, config.initial_state);
    }
  }

  isUnlocked(lockId: string): boolean {
    return this.lockStates.get(lockId) === 'unlocked';
  }

  getLockState(lockId: string): LockStateValue {
    return this.lockStates.get(lockId) ?? 'locked';
  }

  getAllStates(): Record<string, LockStateValue> {
    const result: Record<string, LockStateValue> = {};
    for (const [lockId, state] of this.lockStates) {
      result[lockId] = state;
    }
    return result;
  }

  tryUnlock(lockId: string, playerMessage: string): UnlockResult {
    const config = this.data.locks[lockId];
    if (!config) {
      return { success: false, lockId, reason: '未知的锁' };
    }

    if (this.isUnlocked(lockId)) {
      return { success: false, lockId, reason: '已经解锁' };
    }

    const hardPrerequisite = config.unlock_condition.hard_prerequisite;
    if (hardPrerequisite && !this.isUnlocked(hardPrerequisite)) {
      const reason = config.unlock_condition.hard_prerequisite_reason || '前置条件未满足';
      return { success: false, lockId, reason };
    }

    const prerequisite = config.unlock_condition.prerequisite;
    if (prerequisite && !this.isUnlocked(prerequisite)) {
      return { success: false, lockId, reason: '前置条件未满足' };
    }

    const mustMention = config.unlock_condition.player_must_mention;
    if (mustMention && !this.matchesKeywords(playerMessage, mustMention)) {
      return { success: false, lockId, reason: '未提及必要关键词' };
    }

    this.lockStates.set(lockId, 'unlocked');
    return {
      success: true,
      lockId,
      response: config.unlock_response || '已解锁',
    };
  }

  private matchesKeywords(message: string, patterns: string[]): boolean {
    const normalized = message.toLowerCase();
    return patterns.some((pattern) => {
      const alternatives = pattern.split('|').map((s) => s.trim().toLowerCase());
      return alternatives.some((alt) => normalized.includes(alt));
    });
  }

  forceUnlock(lockId: string): void {
    if (this.data.locks[lockId]) {
      this.lockStates.set(lockId, 'unlocked');
    }
  }

  reset(): void {
    for (const [lockId, config] of Object.entries(this.data.locks)) {
      this.lockStates.set(lockId, config.initial_state);
    }
  }
}

export function createStateMachine(data: StateMachineData): StateMachine {
  return new StateMachine(data);
}
