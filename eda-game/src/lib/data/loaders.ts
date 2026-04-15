import type {
  StateMachineData,
  ToolQueryMap,
  SearchEngineData,
  LuMingyuanDialogData,
  InferenceMapData,
  Case00InferenceMapData,
} from '$lib/engine/types-v2';

let cachedStateMachine: StateMachineData | null = null;
let cachedToolQueryMap: ToolQueryMap | null = null;
let cachedSearchEngine: SearchEngineData | null = null;
let cachedDialog: LuMingyuanDialogData | null = null;
let cachedInferenceMap: InferenceMapData | null = null;
let cachedCase00InferenceMap: Case00InferenceMapData | null = null;

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

export async function loadStateMachine(): Promise<StateMachineData> {
  if (cachedStateMachine) return cachedStateMachine;
  cachedStateMachine = await fetchJson<StateMachineData>('/data/state_machine.json');
  return cachedStateMachine;
}

export async function loadToolQueryMap(): Promise<ToolQueryMap> {
  if (cachedToolQueryMap) return cachedToolQueryMap;
  cachedToolQueryMap = await fetchJson<ToolQueryMap>('/data/tools_query_map.json');
  return cachedToolQueryMap;
}

export async function loadSearchEngine(): Promise<SearchEngineData> {
  if (cachedSearchEngine) return cachedSearchEngine;
  cachedSearchEngine = await fetchJson<SearchEngineData>('/data/search_engine.json');
  return cachedSearchEngine;
}

export async function loadLuMingyuanDialog(): Promise<LuMingyuanDialogData> {
  if (cachedDialog) return cachedDialog;
  cachedDialog = await fetchJson<LuMingyuanDialogData>('/data/lu_mingyuan_dialog.json');
  return cachedDialog;
}

export async function loadInferenceMap(): Promise<InferenceMapData> {
  if (cachedInferenceMap) return cachedInferenceMap;
  cachedInferenceMap = await fetchJson<InferenceMapData>('/data/inference_map.json');
  return cachedInferenceMap;
}

export async function loadCase00InferenceMap(): Promise<Case00InferenceMapData> {
  if (cachedCase00InferenceMap) return cachedCase00InferenceMap;
  cachedCase00InferenceMap = await fetchJson<Case00InferenceMapData>('/data/case00_inference_map.json');
  return cachedCase00InferenceMap;
}

export async function loadTextContent(path: string): Promise<string> {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load ${path}: ${response.status} ${response.statusText}`);
  }
  return response.text();
}

export function clearDataCache(): void {
  cachedStateMachine = null;
  cachedToolQueryMap = null;
  cachedSearchEngine = null;
  cachedDialog = null;
  cachedInferenceMap = null;
  cachedCase00InferenceMap = null;
}
