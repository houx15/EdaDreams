export type GamePhase =
  | 'boot'
  | 'briefing'
  | 'gameplay'
  | 'case_closed';

export type BootBeat =
  | 'B0_post'
  | 'B1_tokenizer'
  | 'B2_next_token'
  | 'B3_self_concept'
  | 'B4_interface';

export type InferenceGrade = 'A' | 'B' | 'C';

export interface KeywordDef {
  pattern: string | RegExp;
  weight: 3 | 2 | 1;
  label: string;
}

export interface InferenceStepConfig {
  stepId: string;
  label: string;
  keywords: KeywordDef[];
  triggerWords: string[];
  unlockEvidence?: string;
  templates: {
    A: string;
    B: string;
    C: string;
  };
  noiseWords?: string[];
  noiseEffect?: string;
  specialLogic?: 'step06_dual_trigger' | 'step10_echo' | null;
}

export interface ContextBlock {
  id: string;
  text: string;
  source: 'evidence' | 'output';
  sourceFile?: string;
  tokenCount: number;
  percentage: number;
  createdAt: number;
}

export interface EvidenceFile {
  id: string;
  filename: string;
  content: string;
  sizeLabel: string;
  caseNumber: string;
  evidenceNumber: number;
  tokenEstimate: number;
  percentageEstimate: number;
}

export interface InferenceResult {
  grade: InferenceGrade;
  output: string;
  triggeredUnlock: boolean;
  unlockedEvidence?: string;
  timestamp: number;
}

export interface GameState {
  phase: GamePhase;
  bootBeat: BootBeat;
  currentCase: number;
  currentStep: number;
  unlockedEvidence: string[];
  openTabs: string[];
  activeTab: string | null;
  inferenceHistory: InferenceResult[];
  caseStatus: 'active' | 'closed';
}

export interface CapacityInfo {
  used: number;
  max: number;
  percentage: number;
  color: 'blue' | 'orange' | 'red';
  overflow: boolean;
}
