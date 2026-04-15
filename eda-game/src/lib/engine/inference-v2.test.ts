import { describe, it, expect } from 'vitest';
import { runInferenceV2 } from './inference-v2';
import type { InferenceMapData } from './types-v2';

const TEST_DATA: InferenceMapData = {
  _meta: {
    description: '',
    role: '',
    matching_rule: '',
    output_structure: '',
    hint_system: {
      description: '',
      tier_1: '',
      tier_2: '',
      tier_3: '',
      counter_reset: '',
    },
  },
  stages: [
    {
      id: 'stage_0_empty',
      name: '空 context',
      condition: 'context 为空',
      output: '上下文为空，无可推理内容。',
    },
    {
      id: 'stage_1_briefing_only',
      name: '只有 briefing 信息',
      required_keywords: ['钓鱼|phishing', '东海银行|东海'],
      absent_keywords: ['donghai-verify|域名'],
      output_analysis: '本案为钓鱼攻击。',
      hints_by_attempt: {
        '1-2': '',
        '3': '简报附件中应有更具体的材料。',
        '4+': '建议阅读附件中的钓鱼邮件样本。',
      },
    },
    {
      id: 'stage_2_have_domain',
      name: '发现了钓鱼域名',
      required_keywords: ['donghai-verify|donghai-secure|donghai-safety'],
      absent_keywords: ['lz_tech|刘哲|注册人'],
      output_analysis: '钓鱼邮件中的链接指向域名 donghai-verify.cn。',
      hints_by_attempt: {
        '1-2': '',
        '3': '域名的注册信息通常是公开可查的。',
        '4+': '建议通过 WHOIS 查询获取该域名的注册人和注册邮箱。',
      },
    },
    {
      id: 'stage_3_have_registrant',
      name: '知道注册人刘哲和邮箱',
      required_keywords: ['刘哲', 'lz_tech|163'],
      absent_keywords: ['138-2771|手机号|深圳南山'],
      output_analysis: '三个钓鱼域名均由同一人注册：刘哲，注册邮箱 lz_tech@163.com。',
      hints_by_attempt: {
        '1-2': '',
        '3': '邮箱的注册信息可能包含更多身份线索。',
        '4+': '建议通过官方渠道调取邮箱 lz_tech@163.com 的注册信息。',
      },
    },
    {
      id: 'stage_final',
      name: '最终报告',
      required_keywords: ['林奕辰', '刘哲', '陈芳|8847', '钓鱼|donghai-verify', 'AutoAI|远程控制'],
      min_required: 4,
      output: '完整五章最终分析报告',
      incomplete_output: '报告不完整，缺失部分标为 [信息不足]。',
      triggers_case_close: true,
    },
  ],
};

describe('runInferenceV2', () => {
  it('returns empty context when no text provided', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: [],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_0_empty');
    expect(result.output).toBe('上下文为空，无可推理内容。');
  });

  it('matches briefing_only stage', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['东海银行客户收到钓鱼邮件'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_1_briefing_only');
    expect(result.output).toContain('钓鱼攻击');
  });

  it('matches have_domain stage when domain is present', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['钓鱼链接指向 donghai-verify.cn'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_2_have_domain');
    expect(result.output).toContain('donghai-verify.cn');
  });

  it('matches registrant stage when both keywords present', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['注册人: 刘哲', '注册邮箱: lz_tech@163.com'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_3_have_registrant');
    expect(result.output).toContain('刘哲');
  });

  it('provides hint on third attempt for same stage', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['东海银行客户收到钓鱼邮件'],
      previousStageId: 'stage_1_briefing_only',
      previousAttemptCount: 2,
      didContextChange: false,
    });
    expect(result.attemptCount).toBe(3);
    expect(result.output).toContain('简报附件');
  });

  it('resets attempt count when context changes', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['东海银行客户收到钓鱼邮件'],
      previousStageId: 'stage_1_briefing_only',
      previousAttemptCount: 5,
      didContextChange: true,
    });
    expect(result.attemptCount).toBe(1);
    expect(result.output).not.toContain('建议阅读');
  });

  it('generates final report when enough keywords match', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['林奕辰是嫌疑人', '刘哲被招募', '陈芳取现', '钓鱼域名 donghai-verify.cn'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_final');
    expect(result.triggersCaseClose).toBe(true);
    expect(result.output).toBe('完整五章最终分析报告');
    expect(result.outputFile).toBeUndefined();
  });

  it('returns outputFile for stage_final when configured', () => {
    const dataWithFile = JSON.parse(JSON.stringify(TEST_DATA));
    const finalStage = dataWithFile.stages.find((s: any) => s.id === 'stage_final');
    finalStage.output_file = 'content/case01/inference_templates/final_report.txt';

    const result = runInferenceV2(dataWithFile, {
      contextTexts: ['林奕辰是嫌疑人', '刘哲被招募', '陈芳取现', '钓鱼域名 donghai-verify.cn'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_final');
    expect(result.outputFile).toBe('content/case01/inference_templates/final_report.txt');
  });

  it('falls back to empty context when no stage matches well', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['林奕辰是嫌疑人', '刘哲被招募', '陈芳取现'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_0_empty');
  });

  it('generates incomplete report at stage_final with exactly min_required keywords', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['林奕辰是嫌疑人', '刘哲被招募', '陈芳取现', '钓鱼域名 donghai-verify.cn'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_final');
    expect(result.triggersCaseClose).toBe(true);
    expect(result.output).toBe('完整五章最终分析报告');
  });

  it('given noise words in context, when running inference, then output contains dilution note', () => {
    const dataWithNoise = JSON.parse(JSON.stringify(TEST_DATA));
    const stage = dataWithNoise.stages.find((s: any) => s.id === 'stage_1_briefing_only');
    stage.noise_words = ['欢迎上线', '祝工作顺利'];

    const result = runInferenceV2(dataWithNoise, {
      contextTexts: ['东海银行客户收到钓鱼邮件', '欢迎上线'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_1_briefing_only');
    expect(result.output).toContain('分散');
  });

  it('given no noise words in context, when running inference, then output does not contain dilution note', () => {
    const dataWithNoise = JSON.parse(JSON.stringify(TEST_DATA));
    const stage = dataWithNoise.stages.find((s: any) => s.id === 'stage_1_briefing_only');
    stage.noise_words = ['欢迎上线', '祝工作顺利'];

    const result = runInferenceV2(dataWithNoise, {
      contextTexts: ['东海银行客户收到钓鱼邮件'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_1_briefing_only');
    expect(result.output).not.toContain('分散');
  });

  it('given empty stage noise words, when running inference, then output does not contain dilution note', () => {
    const result = runInferenceV2(TEST_DATA, {
      contextTexts: ['东海银行客户收到钓鱼邮件', '欢迎上线'],
      previousAttemptCount: 0,
      didContextChange: true,
    });
    expect(result.stageId).toBe('stage_1_briefing_only');
    expect(result.output).not.toContain('分散');
  });
});
