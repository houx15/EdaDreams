import { StateMachine } from '$lib/engine/state-machine';
import { loadStateMachine } from '$lib/data/loaders';
import type { UnlockResult } from '$lib/engine/state-machine';

let sharedStateMachine: StateMachine | null = null;
let loadPromise: Promise<StateMachine> | null = null;

export async function getSharedStateMachine(): Promise<StateMachine> {
  if (sharedStateMachine) return sharedStateMachine;
  if (loadPromise) return loadPromise;

  loadPromise = loadStateMachine().then((data) => {
    sharedStateMachine = new StateMachine(data);
    return sharedStateMachine;
  });

  return loadPromise;
}

export function resetSharedStateMachine(): void {
  sharedStateMachine?.reset();
}

export { UnlockResult };
