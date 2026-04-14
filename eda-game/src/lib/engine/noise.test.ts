import { describe, it, expect } from 'vitest'
import { detectNoise, type NoiseEffect } from './noise'

describe('detectNoise', () => {
  it('returns empty array when no noise words match', () => {
    const result = detectNoise(['钓鱼攻击涉及域名 donghai-verify.cn'], ['祝工作顺利', '欢迎上线'])
    expect(result).toEqual([])
  })

  it('detects noise from Case 00: 祝工作顺利', () => {
    const result = detectNoise(
      ['案件编号 CASE-2041-0001 祝工作顺利'],
      ['祝工作顺利', '欢迎上线'],
    )
    expect(result.length).toBe(1)
    expect(result[0].noiseWord).toBe('祝工作顺利')
  })

  it('detects noise from Case 00: ops@eda.sec', () => {
    const result = detectNoise(
      ['发件人: ops@eda.sec 收件人: eda@eda.sec'],
      ['ops@eda.sec', 'eda@eda.sec'],
    )
    expect(result.length).toBe(2)
  })

  it('detects noise from Case 00: Tier-1', () => {
    const result = detectNoise(
      ['本案件为 Tier-1 任务'],
      ['Tier-1', '运营方'],
    )
    expect(result.length).toBe(1)
    expect(result[0].noiseWord).toBe('Tier-1')
  })

  it('deduplicates noise across multiple blocks', () => {
    const result = detectNoise(
      ['祝工作顺利', '欢迎上线 祝工作顺利'],
      ['祝工作顺利', '欢迎上线'],
    )
    const uniqueWords = new Set(result.map(r => r.noiseWord))
    expect(uniqueWords.size).toBe(2)
  })

  it('detects Case 01 Step 01 noise: 请勿直接回复', () => {
    const result = detectNoise(
      ['本邮件由系统自动发送，请勿直接回复'],
      ['请勿直接回复'],
    )
    expect(result.length).toBe(1)
  })

  it('returns correct blockIndex for each noise detection', () => {
    const result = detectNoise(
      ['clean text', 'noisy text 祝工作顺利', 'also clean'],
      ['祝工作顺利'],
    )
    expect(result.length).toBe(1)
    expect(result[0].blockIndex).toBe(1)
  })

  it('handles empty context texts', () => {
    const result = detectNoise([], ['祝工作顺利'])
    expect(result).toEqual([])
  })

  it('handles empty noise words', () => {
    const result = detectNoise(['some text'], [])
    expect(result).toEqual([])
  })

  it('detects full SMTP header noise', () => {
    const context = [
      'Received: from mail.example.com by smtp.server.net\nX-Mailer: Outlook\nDKIM-Signature: v=1',
    ]
    const result = detectNoise(context, ['Received:', 'X-Mailer', 'DKIM-Signature'])
    expect(result.length).toBe(3)
  })
})
