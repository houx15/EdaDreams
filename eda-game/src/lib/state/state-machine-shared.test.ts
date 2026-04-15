import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSharedStateMachine } from './state-machine-shared';

describe('state-machine-shared', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ locks: {}, transitions: [] }),
    } as unknown as Response);
  });

  it('given multiple calls, when awaiting shared state machine, then resolves to same instance', async () => {
    const a = await getSharedStateMachine();
    const b = await getSharedStateMachine();
    expect(a).toBe(b);
  });

  it('given shared instance, when checking type, then returns a promise', async () => {
    const promise = getSharedStateMachine();
    expect(promise).toBeInstanceOf(Promise);
  });
});
