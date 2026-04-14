import { describe, it, expect, beforeEach } from 'vitest';
import { gameState } from './game.svelte';

describe('GameStateManager', () => {
  beforeEach(() => {
    gameState.reset();
  });

  describe('initial state', () => {
    it('given a fresh game state, when reading phase, then it is boot', () => {
      expect(gameState.phase).toBe('boot');
    });

    it('given a fresh game state, when reading bootBeat, then it is B0_post', () => {
      expect(gameState.bootBeat).toBe('B0_post');
    });

    it('given a fresh game state, when reading currentCase, then it is 0', () => {
      expect(gameState.currentCase).toBe(0);
    });

    it('given a fresh game state, when reading currentStep, then it is 0', () => {
      expect(gameState.currentStep).toBe(0);
    });

    it('given a fresh game state, when reading caseStatus, then it is active', () => {
      expect(gameState.caseStatus).toBe('active');
    });
  });

  describe('advanceBootBeat', () => {
    it('given bootBeat is B0_post, when advancing, then bootBeat becomes B1_tokenizer', () => {
      gameState.advanceBootBeat();
      expect(gameState.bootBeat).toBe('B1_tokenizer');
    });

    it('given bootBeat is B1_tokenizer, when advancing, then bootBeat becomes B2_next_token', () => {
      gameState.advanceBootBeat();
      gameState.advanceBootBeat();
      expect(gameState.bootBeat).toBe('B2_next_token');
    });

    it('given bootBeat is B2_next_token, when advancing, then bootBeat becomes B3_self_concept', () => {
      gameState.advanceBootBeat();
      gameState.advanceBootBeat();
      gameState.advanceBootBeat();
      expect(gameState.bootBeat).toBe('B3_self_concept');
    });

    it('given bootBeat is B3_self_concept, when advancing, then bootBeat becomes B4_interface', () => {
      gameState.advanceBootBeat();
      gameState.advanceBootBeat();
      gameState.advanceBootBeat();
      gameState.advanceBootBeat();
      expect(gameState.bootBeat).toBe('B4_interface');
    });

    it('given bootBeat is B4_interface, when advancing, then bootBeat stays B4_interface', () => {
      for (let i = 0; i < 5; i++) gameState.advanceBootBeat();
      expect(gameState.bootBeat).toBe('B4_interface');
    });
  });

  describe('transitionToBriefing', () => {
    it('given phase is boot, when transitioning to briefing, then phase becomes briefing', () => {
      gameState.transitionToBriefing();
      expect(gameState.phase).toBe('briefing');
    });
  });

  describe('transitionToGameplay', () => {
    it('given phase is briefing, when transitioning to gameplay, then phase becomes gameplay and currentCase is 1', () => {
      gameState.transitionToBriefing();
      gameState.transitionToGameplay();
      expect(gameState.phase).toBe('gameplay');
      expect(gameState.currentCase).toBe(1);
    });

    it('given phase is gameplay, when transitioning to gameplay, then currentStep resets to 0', () => {
      gameState.transitionToBriefing();
      gameState.transitionToGameplay();
      gameState.advanceStep();
      gameState.transitionToGameplay();
      expect(gameState.currentStep).toBe(0);
    });
  });

  describe('advanceStep', () => {
    it('given currentStep is 0, when advancing step, then currentStep becomes 1', () => {
      gameState.transitionToBriefing();
      gameState.transitionToGameplay();
      gameState.advanceStep();
      expect(gameState.currentStep).toBe(1);
    });

    it('given currentStep is 1, when advancing step twice, then currentStep becomes 3', () => {
      gameState.transitionToBriefing();
      gameState.transitionToGameplay();
      gameState.advanceStep();
      gameState.advanceStep();
      gameState.advanceStep();
      expect(gameState.currentStep).toBe(3);
    });
  });

  describe('closeCase', () => {
    it('given an active case, when closing case, then phase becomes case_closed and caseStatus becomes closed', () => {
      gameState.transitionToBriefing();
      gameState.transitionToGameplay();
      gameState.closeCase();
      expect(gameState.phase).toBe('case_closed');
      expect(gameState.caseStatus).toBe('closed');
    });
  });

  describe('reset', () => {
    it('given a modified game state, when resetting, then all values return to initial state', () => {
      gameState.advanceBootBeat();
      gameState.transitionToBriefing();
      gameState.transitionToGameplay();
      gameState.advanceStep();
      gameState.closeCase();
      gameState.reset();
      expect(gameState.phase).toBe('boot');
      expect(gameState.bootBeat).toBe('B0_post');
      expect(gameState.currentCase).toBe(0);
      expect(gameState.currentStep).toBe(0);
      expect(gameState.caseStatus).toBe('active');
    });
  });
});
