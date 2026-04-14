import type { InferenceStepConfig, InferenceGrade, InferenceResult, KeywordDef } from './types'
import { detectTriggers } from './triggers'
import { EMPTY_CONTEXT, CASE00_NOISE_EFFECTS, CASE01_STEP01_NOISE_EFFECTS } from './templates'

interface KeywordMatch {
  label: string
  weight: number
}

interface KeywordMatchResult {
  weight3: KeywordMatch[]
  weight2: KeywordMatch[]
  weight1: KeywordMatch[]
}

function normalizeChinese(text: string): string {
  return text.replace(/[\s，。、；：！？""''（）《》【】\u3000]/g, '')
}

function matchPattern(text: string, pattern: string | RegExp): boolean {
  const normalizedText = normalizeChinese(text)
  if (pattern instanceof RegExp) {
    const flags = pattern.flags.includes('i') ? pattern.flags : pattern.flags + 'i'
    const regex = new RegExp(pattern.source, flags)
    return regex.test(text) || regex.test(normalizedText)
  }
  return text.toLowerCase().includes(pattern.toLowerCase()) ||
    normalizedText.includes(pattern)
}

export function matchKeywords(
  contextTexts: string[],
  keywords: KeywordDef[],
): KeywordMatchResult {
  const result: KeywordMatchResult = { weight3: [], weight2: [], weight1: [] }
  const seen = new Set<string>()

  for (const kw of keywords) {
    if (seen.has(kw.label)) continue

    const matched = contextTexts.some(text => matchPattern(text, kw.pattern))
    if (matched) {
      seen.add(kw.label)
      const entry: KeywordMatch = { label: kw.label, weight: kw.weight }
      if (kw.weight === 3) result.weight3.push(entry)
      else if (kw.weight === 2) result.weight2.push(entry)
      else result.weight1.push(entry)
    }
  }

  return result
}

export function calculateGrade(matches: KeywordMatchResult): InferenceGrade {
  const totalWeight3Keywords = new Set(matches.weight3.map(m => m.label)).size
  if (totalWeight3Keywords === 0) return 'C'
  if (matches.weight2.length > 0) return 'A'
  return 'B'
}

export function runInference(
  contextTexts: string[],
  stepConfig: InferenceStepConfig,
): InferenceResult {
  if (contextTexts.length === 0 || contextTexts.every(t => t.trim() === '')) {
    return {
      grade: 'C',
      output: EMPTY_CONTEXT,
      triggeredUnlock: false,
      timestamp: Date.now(),
    }
  }

  const matches = matchKeywords(contextTexts, stepConfig.keywords)

  const allWeight3Labels = stepConfig.keywords
    .filter(k => k.weight === 3)
    .map(k => k.label)
  const uniqueWeight3Labels = [...new Set(allWeight3Labels)]
  const allWeight3Matched = uniqueWeight3Labels.every(label =>
    matches.weight3.some(m => m.label === label),
  )

  let grade: InferenceGrade
  if (matches.weight3.length === 0) {
    grade = 'C'
  } else if (allWeight3Matched && matches.weight2.length > 0) {
    grade = 'A'
  } else {
    grade = 'B'
  }

  let output: string
  if (grade === 'A') {
    output = stepConfig.templates.A
  } else if (grade === 'B') {
    output = stepConfig.templates.B
  } else {
    output = stepConfig.templates.C
  }

  if (stepConfig.specialLogic === 'step06_dual_trigger') {
    const hasBriefingInfo = contextTexts.some(t =>
      /受影响客户|客户名单|受害者/.test(t),
    )
    if (!hasBriefingInfo && grade === 'A') {
      // Downgrade to B output if briefing info is missing —
      // Eda won't make the "check the client list" connection without context
      output = stepConfig.templates.B
    }
  }

  if (stepConfig.specialLogic === 'step10_echo') {
    const hasStep04Echo = contextTexts.some(t =>
      /189-7654-3210|通话记录/.test(t),
    )
    if (!hasStep04Echo && grade === 'A') {
      output = stepConfig.templates.B
    }
  }

  let triggeredUnlock = false
  if (stepConfig.triggerWords.length > 0) {
    if (stepConfig.specialLogic === 'step06_dual_trigger') {
      const hasBriefingInfo = contextTexts.some(t =>
        /受影响客户|客户名单|受害者/.test(t),
      )
      if (grade === 'A') {
        triggeredUnlock = detectTriggers(output, stepConfig.triggerWords)
      } else if (hasBriefingInfo && grade === 'B') {
        triggeredUnlock = detectTriggers(output, stepConfig.triggerWords)
      }
    } else {
      triggeredUnlock = detectTriggers(output, stepConfig.triggerWords)
    }
  }

  return {
    grade,
    output,
    triggeredUnlock,
    unlockedEvidence: triggeredUnlock ? stepConfig.unlockEvidence : undefined,
    timestamp: Date.now(),
  }
}
