import type { CapacityInfo } from './types'

const CJK_RANGE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u2e80-\u2eff\u3000-\u303f\uff00-\uffef]/

export function countTokens(text: string): number {
  let tokens = 0
  for (const char of text) {
    if (CJK_RANGE.test(char)) {
      tokens += 2
    } else {
      tokens += 1
    }
  }
  return tokens
}

export function getCapacityColor(percentage: number): CapacityInfo['color'] {
  if (percentage >= 80) return 'red'
  if (percentage >= 50) return 'orange'
  return 'blue'
}

export function calculateCapacity(
  blocks: Array<{ text: string }>,
  maxTokens: number,
): CapacityInfo {
  const used = blocks.reduce((sum, block) => sum + countTokens(block.text), 0)
  const percentage = Math.round((used / maxTokens) * 100)
  const color = getCapacityColor(percentage)
  const overflow = percentage > 100

  return { used, max: maxTokens, percentage, color, overflow }
}
