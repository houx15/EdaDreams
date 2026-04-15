export type ToolId = 'whois' | 'gsxt' | 'numquery' | 'ip_lookup' | 'bank' | 'telecom' | 'forensics' | 'police';

export type LockStateValue = 'locked' | 'unlocked';

export interface LockConfig {
  name: string;
  type: 'database' | 'evidence' | 'evidence_chain' | 'police_coordination';
  initial_state: LockStateValue;
  unlock_condition: {
    method: 'phone_call';
    target: 'lu_mingyuan';
    player_must_mention?: string[];
    prerequisite?: string;
    hard_prerequisite?: string;
    hard_prerequisite_reason?: string;
    description?: string;
  };
  unlock_response?: string;
  after_unlock?: string;
  optional?: boolean;
  optional_note?: string;
}

export interface StateMachineData {
  _meta: {
    description: string;
    version: string;
    date: string;
  };
  locks: Record<string, LockConfig>;
  unlock_chain_summary: {
    description: string;
    chains: string[];
    longest_chain: string;
  };
}

export interface SearchResult {
  id: string;
  match: string[];
  title: string;
  source: string;
  summary: string;
  useful: boolean;
  clickable?: boolean;
  opens?: string;
  page_content?: string;
  key_clue?: string;
  noise_note?: string;
  implementation_note?: string;
}

export interface SearchEngineData {
  _meta: {
    description: string;
    matching_rule: string;
    click_behavior: string;
  };
  results: SearchResult[];
}

export interface WhoisQuery {
  match: string[];
  result: Record<string, string> | string;
  key_clues?: string[];
}

export interface GsxtQueryResult {
  企业名称: string;
  法人?: string;
  成立日期?: string;
  注册资本?: string;
  实缴?: string;
  地址?: string;
  状态?: string;
  is_target?: boolean;
  noise_note?: string;
}

export interface GsxtQuery {
  match: string[];
  input_field?: string;
  results: GsxtQueryResult[] | string;
}

export interface NumqueryResult {
  match: string[];
  result: Record<string, string> | string;
  key_clues?: string[];
  not_available?: string;
  note?: string;
}

export interface IpLookupResult {
  match: string[];
  result: Record<string, string> | string;
  key_clues?: string[];
}

export interface BankQuery {
  query_type?: string;
  match: string[];
  result_file?: string;
  result_summary?: string;
  result?: string;
  key_clues?: string[];
  note?: string;
}

export interface TelecomQuery {
  match: string[];
  prerequisite_lock?: string;
  result_file?: string;
  result_summary?: string;
  optional?: boolean;
  key_clues?: string[];
  modifications_needed?: string[];
  locked_response?: string;
  no_data_response?: string;
}

export interface ForensicsFile {
  id: string;
  name: string;
  content_summary: string;
  key_clues?: string[];
  content_file?: string;
}

export interface PoliceQuery {
  match: string[];
  result: Record<string, string>;
  key_clues?: string[];
}

export interface ToolQueryMap {
  _meta: {
    description: string;
    matching_rule: string;
    default_rule: string;
  };
  whois: {
    _tool_info: Record<string, string>;
    queries: WhoisQuery[];
  };
  gsxt: {
    _tool_info: Record<string, string>;
    queries: GsxtQuery[];
    detail_page?: Record<string, { full_content_file: string; note: string }>;
  };
  numquery: {
    _tool_info: Record<string, string>;
    queries: NumqueryResult[];
  };
  ip_lookup: {
    _tool_info: Record<string, string>;
    queries: IpLookupResult[];
  };
  bank: {
    _tool_info: Record<string, string>;
    query_types: string[];
    queries: BankQuery[];
  };
  telecom: {
    _tool_info: Record<string, string>;
    queries: TelecomQuery[];
  };
  forensics: {
    _tool_info: Record<string, string>;
    files: ForensicsFile[];
  };
  police: {
    _tool_info: Record<string, string>;
    queries: PoliceQuery[];
  };
}

export interface DialogEntry {
  id: string;
  match: string[];
  priority: number;
  prerequisite?: string | null;
  prerequisite_check?: string;
  prerequisite_not_met_response?: string;
  prerequisite_met?: boolean;
  additional_match?: string[];
  response?: string;
  response_immediate?: string;
  response_delay_seconds?: number;
  response_followup?: string;
  triggers_unlock?: string;
  follow_up?: string;
  context_check?: string;
  response_if_context_yes?: string;
  response_if_context_no?: string;
  player_must_justify?: boolean;
  valid_justifications?: string[];
  response_after_justification?: string;
  player_confirms?: boolean;
  response_after_confirm?: string;
  lu_hints?: boolean;
  lu_hint_note?: string;
  player_explains?: boolean;
  response_after_explanation?: string;
}

export interface LuMingyuanDialogData {
  _meta: {
    description: string;
    phone_number: string;
    greeting: string;
    matching_rule: string;
    default_response: string;
    farewell: string;
    response_delay: string;
    personality: string;
  };
  dialogs: DialogEntry[];
}

export interface HintConfig {
  '1-2': string;
  '3': string;
  '4+': string;
}

export interface InferenceStage {
  id: string;
  name: string;
  condition?: string;
  required_keywords?: string[];
  absent_keywords?: string[];
  optional_keywords?: string[];
  noise_words?: string[];
  min_required?: number;
  output?: string;
  output_analysis?: string;
  output_file?: string;
  conditional_note?: string;
  hints_by_attempt?: HintConfig;
  note?: string;
  triggers_case_close?: boolean;
  incomplete_output?: string;
}

export interface InferenceMapData {
  _meta: {
    description: string;
    role: string;
    matching_rule: string;
    output_structure: string;
    hint_system: {
      description: string;
      tier_1: string;
      tier_2: string;
      tier_3: string;
      counter_reset: string;
    };
  };
  stages: InferenceStage[];
}

export interface Case00KeywordDef {
  keyword: string[];
  weight: number;
  meaning: string;
  context_hint?: string;
}

export interface Case00NoiseWord {
  keyword: string[];
  effect: string;
}

export interface Case00InferenceMapData {
  _meta: {
    description: string;
    source: string;
    version: string;
    date: string;
  };
  keywords: Case00KeywordDef[];
  output_levels: {
    A: {
      condition: string;
      output_file: string;
      description: string;
    };
    B: {
      condition: string;
      output: string;
      description: string;
    };
    C: {
      condition: string;
      output: string;
      description: string;
    };
    empty: {
      condition: string;
      output: string;
    };
  };
  noise_words: Case00NoiseWord[];
  noise_design_intent: string;
}

export interface EvidenceSource {
  type: 'briefing' | 'attachment' | 'memo' | 'tool' | 'phone_call' | 'forensics_package';
  toolId?: ToolId;
  lockId?: string;
  query?: string;
}

export interface EvidenceItem {
  id: string;
  filename: string;
  displayName: string;
  source: EvidenceSource;
  sizeLabel: string;
  tokenEstimate: number;
  percentageEstimate: number;
  unlockedAt?: number;
}

export type PhoneCallStatus = 'idle' | 'dialing' | 'connected' | 'ended';

export interface DialogMessage {
  speaker: 'player' | 'lu_mingyuan';
  text: string;
  timestamp: number;
  triggeredUnlock?: string;
  isDelayMarker?: boolean;
}

export interface BrowserTabState {
  url: string;
  title: string;
  toolId?: ToolId;
  query?: string;
}

export type WorkbenchTabType = 'document' | 'browser' | 'phone';

export interface WorkbenchTab {
  id: string;
  type: WorkbenchTabType;
  title: string;
  evidenceId?: string;
  browserState?: BrowserTabState;
  phoneNumber?: string;
}
