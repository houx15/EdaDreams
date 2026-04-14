import { describe, it, expect } from 'vitest'
import { detectTriggers } from './triggers'

describe('detectTriggers', () => {
  it('returns true when output contains a trigger word', () => {
    const output = '钓鱼链接指向域名 donghai-verify.cn，这是攻击者注册的仿冒域名。'
    expect(detectTriggers(output, ['donghai-verify.cn'])).toBe(true)
  })

  it('returns false when no trigger words are found', () => {
    const output = '该邮件使用恐吓语气诱导用户操作。'
    expect(detectTriggers(output, ['donghai-verify.cn'])).toBe(false)
  })

  it('returns true when ANY trigger word matches', () => {
    const output = '注册邮箱为 lz_tech@163.com。'
    expect(detectTriggers(output, ['lz_tech@163.com', '刘哲'])).toBe(true)
  })

  it('handles empty trigger words list', () => {
    const output = 'Some output text'
    expect(detectTriggers(output, [])).toBe(false)
  })

  it('handles empty output text', () => {
    expect(detectTriggers('', ['donghai-verify.cn'])).toBe(false)
  })

  it('detects Step 06 dual trigger: 刘哲 + 受害', () => {
    const output = '建议检查名单中是否有刘哲本人——攻击者有时会用自己的账户进行测试，以确认钓鱼流程是否通畅。简报中提到银行提供了一份受影响客户名单。'
    expect(detectTriggers(output, ['刘哲'])).toBe(true)
  })

  it('Step 06: output without briefing info does NOT mention 客户名单', () => {
    const output = '瑞泽信息技术有限公司由刘哲独资设立于 2041-01-05。建议进一步调查刘哲的个人背景信息。'
    expect(detectTriggers(output, ['客户名单', '受害', '受影响'])).toBe(false)
  })

  it('detects Step 09 trigger: 8847 + 海口', () => {
    const output = '资金最终流向账户尾号 8847。该账户的提现地点集中在海口。'
    expect(detectTriggers(output, ['8847'])).toBe(true)
    expect(detectTriggers(output, ['海口', '持有人'])).toBe(true)
  })

  it('detects Step 10 echo trigger: 陈芳 + 189-7654-3210', () => {
    const output = '陈芳的手机号 189-7654-3210 正是刘哲通话记录中出现的号码。'
    expect(detectTriggers(output, ['陈芳'])).toBe(true)
    expect(detectTriggers(output, ['189-7654-3210'])).toBe(true)
  })

  it('detects Step 11 trigger: 完整 + 攻击链', () => {
    const output = '完整攻击链已重建，所有关键证据已收集。'
    expect(detectTriggers(output, ['完整', '重建'])).toBe(true)
    expect(detectTriggers(output, ['攻击链', '证据链', '报告'])).toBe(true)
  })

  it('is case-insensitive for ASCII', () => {
    const output = 'Found DONGHAI-VERIFY.CN in the email headers'
    expect(detectTriggers(output, ['donghai-verify.cn'])).toBe(true)
  })
})
