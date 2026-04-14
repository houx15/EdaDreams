import type { InferenceResult } from '$lib/engine/types';

class InferenceManager {
  history = $state<InferenceResult[]>([]);

  addResult(result: InferenceResult): void {
    this.history = [...this.history, result];
  }

  clearHistory(): void {
    this.history = [];
  }

  get latestResult(): InferenceResult | null {
    return this.history[this.history.length - 1] ?? null;
  }
}

export const inferenceState = new InferenceManager();
