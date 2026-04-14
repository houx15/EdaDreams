import type { GamePhase, BootBeat } from '$lib/engine/types';

const BOOT_BEAT_ORDER: BootBeat[] = [
  'B0_post',
  'B1_tokenizer',
  'B2_next_token',
  'B3_self_concept',
  'B4_interface',
];

class GameStateManager {
  phase = $state<GamePhase>('boot');
  bootBeat = $state<BootBeat>('B0_post');
  currentCase = $state<number>(0);
  currentStep = $state<number>(0);
  caseStatus = $state<'active' | 'closed'>('active');

  advanceBootBeat(): void {
    const idx = BOOT_BEAT_ORDER.indexOf(this.bootBeat);
    if (idx < BOOT_BEAT_ORDER.length - 1) {
      this.bootBeat = BOOT_BEAT_ORDER[idx + 1];
    }
  }

  transitionToBriefing(): void {
    this.phase = 'briefing';
  }

  transitionToGameplay(): void {
    this.phase = 'gameplay';
    this.currentCase = 1;
    this.currentStep = 0;
  }

  advanceStep(): void {
    this.currentStep += 1;
  }

  closeCase(): void {
    this.phase = 'case_closed';
    this.caseStatus = 'closed';
  }

  reset(): void {
    this.phase = 'boot';
    this.bootBeat = 'B0_post';
    this.currentCase = 0;
    this.currentStep = 0;
    this.caseStatus = 'active';
  }
}

export const gameState = new GameStateManager();
