import { describe, it, expect } from 'vitest'
import { countTokens, calculateCapacity, getCapacityColor } from './capacity'

describe('countTokens', () => {
  it('counts 1 token per ASCII character', () => {
    expect(countTokens('abc')).toBe(3)
  })

  it('counts 2 tokens per Chinese character', () => {
    expect(countTokens('钓鱼')).toBe(4)
  })

  it('handles mixed Chinese and ASCII text', () => {
    const text = 'CASE-2041-0001'
    expect(countTokens(text)).toBe(14)
  })

  it('counts Chinese punctuation as 2 tokens', () => {
    expect(countTokens('。、')).toBe(4)
  })

  it('handles empty string', () => {
    expect(countTokens('')).toBe(0)
  })

  it('handles text with numbers and punctuation', () => {
    expect(countTokens('1,183')).toBe(5)
  })

  it('approximates real briefing text', () => {
    const briefing = 'CASE-2041-0001'
    expect(countTokens(briefing)).toBeGreaterThan(0)
  })
})

describe('calculateCapacity', () => {
  it('returns 0% for empty context', () => {
    const result = calculateCapacity([], 10000)
    expect(result.percentage).toBe(0)
    expect(result.used).toBe(0)
    expect(result.overflow).toBe(false)
    expect(result.color).toBe('blue')
  })

  it('calculates percentage correctly for a single block', () => {
    const blocks = [{ text: '钓鱼攻击' }]
    const result = calculateCapacity(blocks, 100)
    expect(result.used).toBe(8)
    expect(result.percentage).toBe(8)
  })

  it('returns blue color for 0-50%', () => {
    const blocks = [{ text: 'a'.repeat(100) }]
    const result = calculateCapacity(blocks, 1000)
    expect(result.percentage).toBe(10)
    expect(result.color).toBe('blue')
  })

  it('returns orange color at exactly 50%', () => {
    const blocks = [{ text: 'a'.repeat(500) }]
    const result = calculateCapacity(blocks, 1000)
    expect(result.percentage).toBe(50)
    expect(result.color).toBe('orange')
  })

  it('returns orange color between 50-80%', () => {
    const blocks = [{ text: 'a'.repeat(650) }]
    const result = calculateCapacity(blocks, 1000)
    expect(result.percentage).toBe(65)
    expect(result.color).toBe('orange')
  })

  it('returns red color at exactly 80%', () => {
    const blocks = [{ text: 'a'.repeat(800) }]
    const result = calculateCapacity(blocks, 1000)
    expect(result.percentage).toBe(80)
    expect(result.color).toBe('red')
  })

  it('returns red color above 80%', () => {
    const blocks = [{ text: 'a'.repeat(900) }]
    const result = calculateCapacity(blocks, 1000)
    expect(result.percentage).toBe(90)
    expect(result.color).toBe('red')
  })

  it('detects overflow above 100%', () => {
    const blocks = [{ text: 'a'.repeat(1100) }]
    const result = calculateCapacity(blocks, 1000)
    expect(result.percentage).toBe(110)
    expect(result.overflow).toBe(true)
    expect(result.color).toBe('red')
  })

  it('sums tokens across multiple blocks', () => {
    const blocks = [
      { text: 'aaaa' },
      { text: 'bbbb' },
    ]
    const result = calculateCapacity(blocks, 100)
    expect(result.used).toBe(8)
    expect(result.percentage).toBe(8)
  })

  it('handles Case 00 max tokens (~1500)', () => {
    const chineseText = '钓鱼攻击案件编号东海银行'
    const tokens = countTokens(chineseText)
    expect(tokens).toBe(24)
    const result = calculateCapacity([{ text: chineseText }], 1500)
    expect(result.used).toBe(24)
    expect(result.percentage).toBe(Math.round((24 / 1500) * 100))
  })

  it('handles Case 01 max tokens (~10000)', () => {
    const text = 'donghai-verify.cn 是钓鱼域名'
    const tokens = countTokens(text)
    expect(tokens).toBe(28)
    const result = calculateCapacity([{ text }], 10000)
    expect(result.percentage).toBeLessThan(1)
  })
})

describe('getCapacityColor', () => {
  it('returns blue for 0%', () => {
    expect(getCapacityColor(0)).toBe('blue')
  })

  it('returns blue for 49%', () => {
    expect(getCapacityColor(49)).toBe('blue')
  })

  it('returns orange for 50%', () => {
    expect(getCapacityColor(50)).toBe('orange')
  })

  it('returns orange for 79%', () => {
    expect(getCapacityColor(79)).toBe('orange')
  })

  it('returns red for 80%', () => {
    expect(getCapacityColor(80)).toBe('red')
  })

  it('returns red for 100%', () => {
    expect(getCapacityColor(100)).toBe('red')
  })
})
