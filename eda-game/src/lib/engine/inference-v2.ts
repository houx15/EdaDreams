import type { InferenceMapData, InferenceStage, HintConfig } from '$lib/engine/types-v2';

export interface RunInferenceV2Options {
  contextTexts: string[];
  previousStageId?: string;
  previousAttemptCount: number;
  didContextChange: boolean;
}

export interface InferenceV2Result {
  stageId: string;
  stageName: string;
  output: string;
  triggersCaseClose: boolean;
  attemptCount: number;
  outputFile?: string;
}

function normalizeForMatching(text: string): string {
  return text.replace(/[\s，。、；：！？""''（）《》【】\u3000]/g, '').toLowerCase();
}

function containsKeyword(text: string, pattern: string): boolean {
  const normalized = normalizeForMatching(text);
  const alternatives = pattern.split('|').map((s) => s.trim().toLowerCase());
  return alternatives.some((alt) => {
    const altNormalized = normalizeForMatching(alt);
    return normalized.includes(altNormalized) || text.toLowerCase().includes(alt);
  });
}

function containsAnyKeyword(texts: string[], pattern: string): boolean {
  return texts.some((text) => containsKeyword(text, pattern));
}

function countKeywordMatches(texts: string[], patterns: string[]): number {
  let count = 0;
  for (const pattern of patterns) {
    if (containsAnyKeyword(texts, pattern)) {
      count++;
    }
  }
  return count;
}

function scoreStage(texts: string[], stage: InferenceStage): number {
  if (stage.condition === 'context 为空') {
    return texts.length === 0 || texts.every((t) => t.trim() === '') ? 1000 : -1;
  }

  const required = stage.required_keywords ?? [];
  const absent = stage.absent_keywords ?? [];
  const optional = stage.optional_keywords ?? [];

  const requiredMatches = countKeywordMatches(texts, required);
  const minRequired = stage.min_required ?? required.length;
  if (requiredMatches < minRequired) {
    return -1;
  }

  for (const absentPattern of absent) {
    if (containsAnyKeyword(texts, absentPattern)) {
      return -1;
    }
  }

  const optionalMatches = countKeywordMatches(texts, optional);
  return requiredMatches * 10 + optionalMatches;
}

function selectHint(hints: HintConfig | undefined, attemptCount: number): string {
  if (!hints) return '';
  if (attemptCount <= 2) return hints['1-2'] ?? '';
  if (attemptCount === 3) return hints['3'] ?? '';
  return hints['4+'] ?? '';
}

function computeNoiseDilutionNote(contextTexts: string[], noiseWords: string[] | undefined): string {
  if (!noiseWords || noiseWords.length === 0) return '';
  const matched = noiseWords.filter((word) =>
    contextTexts.some((text) => text.includes(word))
  );
  if (matched.length === 0) return '';
  return `[注意：上下文中包含部分与当前分析关联较弱的内容（${matched.join('、')}），可能分散焦点。]`;
}

export function runInferenceV2(
  data: InferenceMapData,
  options: RunInferenceV2Options,
): InferenceV2Result {
  const { contextTexts, previousStageId, previousAttemptCount, didContextChange } = options;

  const isEmpty = contextTexts.length === 0 || contextTexts.every((t) => t.trim() === '');

  let bestStage: InferenceStage | null = null;
  let bestScore = -1;

  for (const stage of data.stages) {
    const score = scoreStage(contextTexts, stage);
    if (score > bestScore) {
      bestScore = score;
      bestStage = stage;
    }
  }

  if (!bestStage) {
    return {
      stageId: 'stage_0_empty',
      stageName: '空 context',
      output: '上下文为空，无可推理内容。',
      triggersCaseClose: false,
      attemptCount: 1,
      outputFile: undefined,
    };
  }

  const stageId = bestStage.id;
  const attemptCount =
    !didContextChange && previousStageId === stageId ? previousAttemptCount + 1 : 1;

  if (stageId === 'stage_0_empty' || (isEmpty && bestStage.condition === 'context 为空')) {
    return {
      stageId: 'stage_0_empty',
      stageName: '空 context',
      output: bestStage.output || '上下文为空，无可推理内容。',
      triggersCaseClose: false,
      attemptCount,
      outputFile: bestStage.output_file,
    };
  }

  if (stageId === 'stage_final') {
    const required = bestStage.required_keywords ?? [];
    const minRequired = bestStage.min_required ?? required.length;
    const matchedCount = countKeywordMatches(contextTexts, required);
    const isComplete = matchedCount >= minRequired;

    if (isComplete) {
      return {
        stageId,
        stageName: bestStage.name,
        output: bestStage.output || '完整五章最终分析报告',
        triggersCaseClose: true,
        attemptCount,
        outputFile: bestStage.output_file,
      };
    } else {
      return {
        stageId,
        stageName: bestStage.name,
        output: bestStage.incomplete_output || '报告不完整，部分信息缺失。',
        triggersCaseClose: false,
        attemptCount,
        outputFile: bestStage.output_file,
      };
    }
  }

  let output = bestStage.output_analysis || '';

  if (bestStage.conditional_note) {
    output += '\n\n' + bestStage.conditional_note;
  }

  const noiseNote = computeNoiseDilutionNote(contextTexts, bestStage.noise_words);
  if (noiseNote) {
    output += '\n\n' + noiseNote;
  }

  const hint = selectHint(bestStage.hints_by_attempt, attemptCount);
  if (hint) {
    output += '\n\n' + hint;
  }

  return {
    stageId,
    stageName: bestStage.name,
    output: output.trim(),
    triggersCaseClose: false,
    attemptCount,
    outputFile: bestStage.output_file,
  };
}
