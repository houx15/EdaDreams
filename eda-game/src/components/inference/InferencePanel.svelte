<script lang="ts">
  import { contextState } from '$lib/state/context.svelte';
  import { inferenceState } from '$lib/state/inference.svelte';
  import { evidenceState } from '$lib/state/evidence.svelte';
  import { gameState } from '$lib/state/game.svelte';
  import { runInference } from '$lib/engine/inference';
  import { CASE00_STEP, CASE01_STEPS } from '$lib/engine/keywords';
  import ContextInput from './ContextInput.svelte';
  import InferButton from './InferButton.svelte';
  import AnalysisOutput from './AnalysisOutput.svelte';

  let loading = $state(false);

  interface UnlockEvent {
    evidenceId: string;
  }

  interface Props {
    onUnlock?: (event: UnlockEvent) => void;
  }

  let { onUnlock }: Props = $props();

  function handleInfer(): void {
    if (loading) return;
    if (contextState.blocks.length === 0) return;

    loading = true;

    const delay = 1000 + Math.random() * 2000;

    setTimeout(() => {
      const contextTexts = contextState.blocks.map((b) => b.text);

      let stepConfig;
      let stepIndex = -1;
      if (gameState.currentCase === 0) {
        stepConfig = CASE00_STEP;
      } else {
        stepIndex = Math.min(gameState.currentStep, CASE01_STEPS.length - 1);
        stepConfig = CASE01_STEPS[stepIndex];
      }

      const result = runInference(contextTexts, stepConfig);
      inferenceState.addResult(result);

      // Handle evidence unlock + step advancement
      if (result.triggeredUnlock) {
        if (result.unlockedEvidence) {
          evidenceState.unlock(result.unlockedEvidence);
          onUnlock?.({ evidenceId: result.unlockedEvidence });
        }
        // Advance step even when no evidence to unlock (e.g. step 11 → 12)
        gameState.advanceStep();
      }

      // Case closure: final step with A-grade closes the case
      if (
        gameState.currentCase === 1 &&
        stepIndex === CASE01_STEPS.length - 1 &&
        result.grade === 'A'
      ) {
        gameState.closeCase();
      }

      if (result.output.trim()) {
        contextState.addBlock(result.output, 'output');
      }

      loading = false;
    }, delay);
  }

  function handleClear(): void {
    contextState.clearBlocks();
  }

  function handleDeleteBlock(id: string): void {
    contextState.removeBlock(id);
  }
</script>

<div class="inference">
  <ContextInput
    blocks={contextState.blocks}
    capacity={contextState.capacityInfo}
    onDeleteBlock={handleDeleteBlock}
  />

  <InferButton {loading} onInfer={handleInfer} onClear={handleClear} />

  <AnalysisOutput output={inferenceState.latestResult} />
</div>

<style>
  .inference {
    grid-area: inference;
    background: var(--bg-panel);
    border-left: 1px solid var(--border-dark);
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
