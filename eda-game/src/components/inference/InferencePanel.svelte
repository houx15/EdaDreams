<script lang="ts">
  import { contextState } from '$lib/state/context.svelte';
  import { inferenceState } from '$lib/state/inference.svelte';
  import { gameState } from '$lib/state/game.svelte';
  import { runInference } from '$lib/engine/inference';
  import { runInferenceV2 } from '$lib/engine/inference-v2';
  import { CASE00_STEP } from '$lib/engine/keywords';
  import { loadInferenceMap, loadCase00InferenceMap, loadTextContent } from '$lib/data/loaders';
  import type { InferenceV2Result } from '$lib/engine/inference-v2';
  import ContextInput from './ContextInput.svelte';
  import InferButton from './InferButton.svelte';
  import AnalysisOutput from './AnalysisOutput.svelte';

  let loading = $state(false);
  let inferenceMap = $state<import('$lib/engine/types-v2').InferenceMapData | null>(null);
  let case00Map = $state<import('$lib/engine/types-v2').Case00InferenceMapData | null>(null);

  // Track v2 inference state for hint system
  let lastV2Result = $state<InferenceV2Result | null>(null);
  let previousContextHash = $state<string>('');

  Promise.all([loadInferenceMap(), loadCase00InferenceMap()]).then(([im, c0]) => {
    inferenceMap = im;
    case00Map = c0;
  });

  function hashContext(texts: string[]): string {
    return texts.join('|');
  }

  function handleInfer(): void {
    if (loading) return;
    if (contextState.blocks.length === 0) return;

    loading = true;
    const delay = 1000 + Math.random() * 2000;

    setTimeout(async () => {
      const contextTexts = contextState.blocks.map((b) => b.text);

      if (gameState.currentCase === 0) {
        // Case 00: use old inference engine
        const result = runInference(contextTexts, CASE00_STEP);
        inferenceState.addResult(result);
        if (result.output.trim()) {
          contextState.addBlock(result.output, 'output');
        }
      } else {
        // Case 01+: use v2 inference engine
        if (!inferenceMap) {
          loading = false;
          return;
        }

        const currentHash = hashContext(contextTexts);
        const didContextChange = currentHash !== previousContextHash;
        previousContextHash = currentHash;

        const v2Result = runInferenceV2(inferenceMap, {
          contextTexts,
          previousStageId: lastV2Result?.stageId,
          previousAttemptCount: lastV2Result?.attemptCount ?? 0,
          didContextChange,
        });

        lastV2Result = v2Result;

        let outputText = v2Result.output;
        if (v2Result.outputFile) {
          const path = v2Result.outputFile.replace(/^content\/case01\//, '/data/content/case01/');
          try {
            outputText = await loadTextContent(path);
          } catch {
            // fallback to inline output
          }
        }

        // Map v2 result to old InferenceResult shape for compatibility
        inferenceState.addResult({
          grade: v2Result.triggersCaseClose ? 'A' : 'B',
          output: outputText,
          triggeredUnlock: v2Result.triggersCaseClose,
          timestamp: Date.now(),
        });

        if (v2Result.triggersCaseClose) {
          gameState.closeCase();
        }

        if (outputText.trim()) {
          contextState.addBlock(outputText, 'output');
        }
      }

      loading = false;
    }, delay);
  }

  function handleClear(): void {
    contextState.clearBlocks();
    lastV2Result = null;
    previousContextHash = '';
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
