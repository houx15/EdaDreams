import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadStateMachine,
  loadToolQueryMap,
  loadSearchEngine,
  loadLuMingyuanDialog,
  loadInferenceMap,
  loadCase00InferenceMap,
  loadTextContent,
  clearDataCache,
} from './loaders';

describe('data loaders', () => {
  beforeEach(() => {
    clearDataCache();
    vi.restoreAllMocks();
  });

  it('given fetch returns state machine json, when loading, then returns parsed data', async () => {
    const mockData = { locks: { bank_system: { keywords: ['银行'] } } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    const result = await loadStateMachine();
    expect(result.locks.bank_system).toBeDefined();
    expect(fetch).toHaveBeenCalledWith('/data/state_machine.json');
  });

  it('given fetch returns tool query map, when loading, then returns parsed data', async () => {
    const mockData = { whois: { queries: [] } };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    const result = await loadToolQueryMap();
    expect(result.whois).toBeDefined();
    expect(fetch).toHaveBeenCalledWith('/data/tools_query_map.json');
  });

  it('given fetch returns search engine data, when loading, then returns parsed data', async () => {
    const mockData = { results: [{ id: 'r1', match: ['test'] }] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    const result = await loadSearchEngine();
    expect(result.results[0].id).toBe('r1');
  });

  it('given fetch returns dialog data, when loading, then returns parsed data', async () => {
    const mockData = { _meta: { greeting: 'hello' }, dialogs: [] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    const result = await loadLuMingyuanDialog();
    expect(result._meta.greeting).toBe('hello');
  });

  it('given fetch returns inference map, when loading, then returns parsed data', async () => {
    const mockData = { stages: [{ id: 'stage_0_empty', name: 'empty' }] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    const result = await loadInferenceMap();
    expect(result.stages[0].id).toBe('stage_0_empty');
  });

  it('given fetch returns case00 inference map, when loading, then returns parsed data', async () => {
    const mockData = { steps: [{ stepId: 'step_00', keywords: [] }] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    const result = await loadCase00InferenceMap();
    expect(result.steps[0].stepId).toBe('step_00');
  });

  it('given fetch returns text, when loading text content, then returns text', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('hello world'),
    } as unknown as Response);

    const result = await loadTextContent('/data/content/case01/test.txt');
    expect(result).toBe('hello world');
  });

  it('given fetch fails, when loading, then throws error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as unknown as Response);

    await expect(loadStateMachine()).rejects.toThrow('Failed to load /data/state_machine.json');
  });

  it('given cached data, when loading again, then uses cache and does not fetch', async () => {
    const mockData = { locks: {} };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    await loadStateMachine();
    await loadStateMachine();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('given cache cleared, when loading again, then fetches fresh data', async () => {
    const mockData = { locks: {} };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    } as unknown as Response);

    await loadStateMachine();
    clearDataCache();
    await loadStateMachine();
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
