import { describe, it, expect } from 'vitest'
import type { InferenceStepConfig, InferenceGrade } from './types'
import { matchKeywords, calculateGrade, runInference } from './inference'
import { CASE00_STEP, CASE01_STEPS } from './keywords'

describe('matchKeywords', () => {
  it('finds keyword matches in context text', () => {
    const context = ['CASE-2041-0001 钓鱼攻击，1,183 名客户收到邮件']
    const result = matchKeywords(context, CASE00_STEP.keywords)
    expect(result.weight3.length).toBeGreaterThan(0)
  })

  it('deduplicates matches across multiple blocks', () => {
    const context = ['CASE-2041-0001', 'CASE-2041-0001 again']
    const result = matchKeywords(context, CASE00_STEP.keywords)
    const caseMatches = result.weight3.filter(m => m.label === '案件识别')
    expect(caseMatches.length).toBe(1)
  })

  it('matches Chinese text ignoring spaces and punctuation', () => {
    const context = ['案件  编号 CASE-2041-0001']
    const result = matchKeywords(context, CASE00_STEP.keywords)
    expect(result.weight3.some(m => m.label === '案件识别')).toBe(true)
  })

  it('fuzzy matches numbers: 1,183 matches 1183 pattern', () => {
    const context = ['共有 1,183 人收到邮件']
    const result = matchKeywords(context, CASE00_STEP.keywords)
    expect(result.weight2.some(m => m.label === '事件规模-邮件数')).toBe(true)
  })

  it('fuzzy matches numbers: ¥384,000 matches 384000 pattern', () => {
    const context = ['金额合计约 ¥384,000']
    const result = matchKeywords(context, CASE00_STEP.keywords)
    expect(result.weight2.some(m => m.label === '事件规模-金额')).toBe(true)
  })

  it('returns empty arrays for no matches', () => {
    const context = ['完全无关的文本内容']
    const result = matchKeywords(context, CASE00_STEP.keywords)
    expect(result.weight3).toEqual([])
    expect(result.weight2).toEqual([])
    expect(result.weight1).toEqual([])
  })

  it('handles empty context', () => {
    const result = matchKeywords([], CASE00_STEP.keywords)
    expect(result.weight3).toEqual([])
  })

  it('handles regex patterns in keywords', () => {
    const context = ['donghai-verify.cn 是钓鱼域名']
    const step = CASE01_STEPS[0]
    const result = matchKeywords(context, step.keywords)
    expect(result.weight3.some(m => m.label === '钓鱼域名')).toBe(true)
  })

  it('matches Step 02 keywords: lz_tech and 刘哲', () => {
    const context = ['注册邮箱: lz_tech@163.com 注册人: 刘哲']
    const step = CASE01_STEPS[1]
    const result = matchKeywords(context, step.keywords)
    expect(result.weight3.length).toBe(2)
  })

  it('matches Step 06 compound keywords: 刘哲 + 法定代表人', () => {
    const context = ['法定代表人: 刘哲 持股 100%']
    const step = CASE01_STEPS[5]
    const result = matchKeywords(context, step.keywords)
    expect(result.weight3.some(m => m.label === '身份锁定-刘哲')).toBe(true)
    expect(result.weight3.some(m => m.label === '身份锁定-法人')).toBe(true)
  })
})

describe('calculateGrade', () => {
  it('returns C for no weight-3 matches', () => {
    const result = calculateGrade({ weight3: [], weight2: [], weight1: [] })
    expect(result).toBe('C')
  })

  it('returns B for some but not all weight-3 matches', () => {
    const result = calculateGrade({
      weight3: [{ label: 'test', weight: 3 }],
      weight2: [],
      weight1: [],
    })
    expect(result).toBe('B')
  })

  it('returns A when all weight-3 matched and at least 1 weight-2', () => {
    const result = calculateGrade({
      weight3: [{ label: 'a', weight: 3 }, { label: 'b', weight: 3 }],
      weight2: [{ label: 'c', weight: 2 }],
      weight1: [],
    })
    expect(result).toBe('A')
  })

  it('returns B when all weight-3 matched but no weight-2', () => {
    const result = calculateGrade({
      weight3: [{ label: 'a', weight: 3 }, { label: 'b', weight: 3 }],
      weight2: [],
      weight1: [],
    })
    expect(result).toBe('B')
  })
})

describe('runInference', () => {
  describe('Case 00 boot inference', () => {
    it('returns empty context message when context is empty', () => {
      const result = runInference([], CASE00_STEP)
      expect(result.output).toBe('上下文为空，无可推理内容。')
      expect(result.grade).toBe('C')
      expect(result.triggeredUnlock).toBe(false)
    })

    it('produces A-grade with ideal context', () => {
      const context = [
        '案件编号 CASE-2041-0001',
        '东海银行 钓鱼攻击事件',
        '1,183 名客户收到钓鱼邮件',
        '47 名客户输入了凭证',
        '金额合计约 ¥384,000',
        '钓鱼域名追踪',
      ]
      const result = runInference(context, CASE00_STEP)
      expect(result.grade).toBe('A')
      expect(result.output).toContain('凭证钓鱼')
      expect(result.output).toContain('东海银行')
      expect(result.output).toContain('CASE-2041-0001')
    })

    it('produces C-grade with irrelevant context', () => {
      const context = ['完全无关的文本']
      const result = runInference(context, CASE00_STEP)
      expect(result.grade).toBe('C')
      expect(result.output).toContain('信息不足')
    })

    it('produces B-grade with partial context (missing case number)', () => {
      const context = ['钓鱼攻击事件，但不知道案件编号']
      const result = runInference(context, CASE00_STEP)
      expect(result.grade).toBe('B')
      expect(result.output).toContain('钓鱼')
    })
  })

  describe('Case 01 Step 01', () => {
    const step = CASE01_STEPS[0]

    it('A-grade with donghai-verify.cn + date → triggers unlock', () => {
      const context = [
        '钓鱼链接: https://www.donghai-verify.cn/auth/login',
        '实际发件地址: noreply@donghai-verify.cn',
        '发送时间: 2041-03-15 09:22',
        '24小时内验证身份',
      ]
      const result = runInference(context, step)
      expect(result.grade).toBe('A')
      expect(result.output).toContain('donghai-verify.cn')
      expect(result.triggeredUnlock).toBe(true)
    })

    it('C-grade without donghai-verify', () => {
      const context = ['这是一封电子邮件，没有什么有用的信息']
      const result = runInference(context, step)
      expect(result.grade).toBe('C')
    })
  })

  describe('Case 01 Step 06 — Dual Trigger', () => {
    const step = CASE01_STEPS[5]

    it('A-grade WITH briefing info → mentions 客户名单 → triggers unlock', () => {
      const context = [
        '法定代表人: 刘哲 持股 100%',
        '成立日期 2041-01-05',
        '实缴资本: 0 元',
        '银行提供了一份受影响客户名单',
      ]
      const result = runInference(context, step)
      expect(result.grade).toBe('A')
      expect(result.output).toContain('客户名单')
      expect(result.triggeredUnlock).toBe(true)
    })

    it('A-grade WITHOUT briefing info → uses B template but still triggers unlock', () => {
      const context = [
        '法定代表人: 刘哲 持股 100%',
        '成立日期 2041-01-05',
        '实缴资本: 0 元',
      ]
      const result = runInference(context, step)
      expect(result.grade).toBe('A')
      expect(result.output).not.toContain('客户名单')
      expect(result.triggeredUnlock).toBe(true)
    })
  })

  describe('Case 01 Step 07 — Test detection', () => {
    const step = CASE01_STEPS[6]

    it('A-grade with 刘哲 + 03-14 + ¥500 → detects test behavior', () => {
      const context = [
        '刘哲出现在第 17 号',
        '时间 03-14 23:47',
        '金额 ¥500',
        '47 名客户受影响',
      ]
      const result = runInference(context, step)
      expect(result.grade).toBe('A')
      expect(result.output).toContain('测试')
      expect(result.triggeredUnlock).toBe(true)
    })
  })

  describe('Case 01 Step 10 — Echo', () => {
    const step = CASE01_STEPS[9]

    it('A-grade with 陈芳 + 189-7654-3210 + preserved Step 04 conclusion', () => {
      const context = [
        '持有人: 陈芳',
        '手机号: 189-7654-3210',
        '海口',
        '刘哲通话记录中出现的号码 189-7654-3210',
      ]
      const result = runInference(context, step)
      expect(result.grade).toBe('A')
      expect(result.output).toContain('陈芳')
      expect(result.output).toContain('189-7654-3210')
      expect(result.triggeredUnlock).toBe(true)
    })

    it('B-grade with 陈芳 but NO Step 04 conclusion → no association', () => {
      const context = [
        '持有人: 陈芳',
        '开户日期 2041-02-20',
      ]
      const result = runInference(context, step)
      expect(result.grade).toBe('B')
      expect(result.output).not.toContain('通话记录')
    })
  })

  describe('Full chain: Step 01→12', () => {
    const stepContexts: Array<{ texts: string[]; expectedGrade: InferenceGrade; stepIndex: number }> = [
      {
        stepIndex: 0,
        texts: [
          'donghai-verify.cn 钓鱼链接',
          'noreply@donghai-verify.cn 实际发件地址',
          '2041-03-15 09:22',
          '24小时内验证身份',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 1,
        texts: [
          '注册邮箱: lz_tech@163.com',
          '注册人: 刘哲',
          '注册日期: 03-10',
          '三个域名同时注册',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 2,
        texts: [
          '注册手机: 138-2771-9403',
          '深圳 南山区',
          'vps996 服务器续费',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 3,
        texts: [
          '0755-8832-6617 固定电话',
          '刘哲 实名登记',
          '57 条短信 群发',
          '189-7654-3210 关联号码',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 4,
        texts: [
          '瑞泽信息技术有限公司',
          '南山区科技园 创智大厦',
          '2041-01-15',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 5,
        texts: [
          '法定代表人 刘哲 100%',
          '2041-01-05 成立日期',
          '实缴资本: 0 元',
          '受影响客户名单 受害者',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 6,
        texts: [
          '刘哲 03-14 23:47',
          '¥500 异常低金额',
          '47 人',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 7,
        texts: [
          '8847 尾号',
          '381,500 转出',
          '过水 23 分钟 停留时间',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 8,
        texts: [
          '海口 ATM 取现',
          '8847 持有人',
          '加密货币 BTC',
          '第三方支付',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 9,
        texts: [
          '陈芳',
          '189-7654-3210',
          '海口 龙华区',
          '刘哲 通话记录',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 10,
        texts: [
          '攻击链 证据链 完整',
          '刘哲 陈芳',
          '准备期 46 天',
          '03-14 19:07 致电陈芳',
        ],
        expectedGrade: 'A',
      },
      {
        stepIndex: 11,
        texts: [
          '刘哲 主犯',
          '陈芳 同伙',
          '钓鱼 donghai-verify',
          '384,200',
          '3301 8847 资金链',
          'ATM 加密货币',
        ],
        expectedGrade: 'A',
      },
    ]

    for (const { stepIndex, texts, expectedGrade } of stepContexts) {
      it(`Step ${String(stepIndex + 1).padStart(2, '0')}: ${CASE01_STEPS[stepIndex].label} → ${expectedGrade}-grade`, () => {
        const result = runInference(texts, CASE01_STEPS[stepIndex])
        expect(result.grade).toBe(expectedGrade)
        expect(result.output.length).toBeGreaterThan(0)
      })
    }
  })

  describe('Step 11 — trigger detection', () => {
    const step = CASE01_STEPS[10]

    it('A-grade output contains trigger words 完整 + 攻击链', () => {
      const context = [
        '完整攻击链 刘哲 陈芳',
        '准备期 46 天',
        '03-14 19:07 致电陈芳',
      ]
      const result = runInference(context, step)
      expect(result.grade).toBe('A')
      expect(result.output).toContain('完整')
      expect(result.output).toContain('攻击链')
      expect(result.triggeredUnlock).toBe(true)
    })
  })

  describe('Step 12 — final report', () => {
    const step = CASE01_STEPS[11]

    it('A-grade with all key information → CASE CLOSED', () => {
      const context = [
        '刘哲 主犯',
        '陈芳 同伙',
        '钓鱼 donghai-verify',
        '384,200 总金额',
        '3301 8847 资金链',
        'ATM 加密货币 洗钱',
      ]
      const result = runInference(context, step)
      expect(result.grade).toBe('A')
      expect(result.output).toContain('CASE CLOSED')
    })

    it('C-grade with insufficient info', () => {
      const context = ['一些不太相关的信息']
      const result = runInference(context, step)
      expect(result.grade).toBe('C')
    })
  })
})
