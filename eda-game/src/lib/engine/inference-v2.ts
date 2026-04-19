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
    if (requiredMatches === 0) return -1;
    if (stage.min_required !== undefined && stage.min_required < required.length) {
      return requiredMatches * 2;
    }
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

function generateIncompleteReport(
  contextTexts: string[],
  requiredKeywords: string[],
): string {
  const hasGroup = requiredKeywords.map((pattern) =>
    containsAnyKeyword(contextTexts, pattern)
  );

  const hasLinYichen = hasGroup[0];
  const hasLiuZhe = hasGroup[1];
  const hasChenFang = hasGroup[2];
  const hasPhishing = hasGroup[3];
  const hasAutoAI = hasGroup[4];

  const lines: string[] = [];
  lines.push('最终分析报告（不完整）');
  lines.push('');

  lines.push('一、案件概述');
  lines.push('');
  lines.push('  2041 年 3 月 15 日至 17 日，东海商业银行 1,183 名网银客户');
  lines.push('  收到伪冒银行官方通知的钓鱼邮件。47 名客户输入凭证，');
  lines.push('  其中 27 人账户发生可疑转账，累计损失 ¥384,200。');
  lines.push('');

  lines.push('二、犯罪组织结构');
  lines.push('');

  if (hasLinYichen) {
    lines.push('  主犯: 林奕辰');
    lines.push('  身份证: 420106199307XXXXXX');
    lines.push('  地址: 武汉市洪山区雄楚大道 329 号 鹏程花园 4 栋 1703');
    lines.push('  背景: 网络安全研究员（前渗透测试工程师，2020 年后自由职业）');
    lines.push('  角色: 攻击策划、钓鱼系统搭建、AutoAI 远程操控');
  } else {
    lines.push('  主犯: [信息不足] — 现有证据指向存在幕后操控者，但身份尚未确认。');
  }
  lines.push('');

  if (hasLiuZhe) {
    lines.push('  人头: 刘哲');
    lines.push('  身份证: 440381199508XXXXXX');
    lines.push('  职业: 外卖骑手（饿了么深圳南山站）');
    lines.push('  角色: 被 ¥3,000 佣金招募，以其身份注册壳公司和域名，');
    lines.push('       手机被 AutoAI 远程操控执行全部技术操作');
    lines.push('  本人不具备技术能力，不知情参与犯罪');
  } else {
    lines.push('  刘哲: [信息不足] — 已知存在一名被招募人员，但身份信息未确认。');
  }
  lines.push('');

  if (hasChenFang) {
    lines.push('  卡农: 陈芳');
    lines.push('  身份证: 460100199212XXXXXX');
    lines.push('  地址: 海口市龙华区');
    lines.push('  角色: 被"跨境代购资金周转"话术招募，负责接收转账并取现');
    lines.push('  本人不知情参与洗钱');
  } else {
    lines.push('  陈芳: [信息不足] — 负责资金洗白的下游人员信息未确认。');
  }
  lines.push('');

  lines.push('三、攻击链');
  lines.push('');

  if (hasAutoAI) {
    lines.push('  远程操控阶段:');
    lines.push('    林奕辰通过 AutoAI 远程操控刘哲手机，');
    lines.push('    执行注册域名、配置邮箱、群发钓鱼邮件、转账等操作。');
    lines.push('    控制端地址片段指向武汉，与 VPS 登录 IP 吻合。');
  } else {
    lines.push('  远程操控阶段: [信息不足] — 攻击的远程操控手段尚未确认，');
    lines.push('    刘哲的技术能力与攻击复杂度不匹配，存在被外部控制的可能。');
  }
  lines.push('');

  if (hasPhishing) {
    lines.push('  钓鱼阶段:');
    lines.push('    通过仿冒域名（donghai-verify/secure/safety.cn）');
    lines.push('    群发 1,183 封钓鱼邮件 + 57 条短信，47 人输入凭证。');
  } else {
    lines.push('  钓鱼阶段: [信息不足] — 钓鱼攻击的具体手法和域名信息未确认。');
  }
  lines.push('');

  if (hasChenFang) {
    lines.push('  资金转移阶段:');
    lines.push('    资金经由刘哲账户（尾号 3301）中转至陈芳账户（尾号 8847），');
    lines.push('    通过 ATM 取现、第三方支付、加密货币等方式洗白。');
  } else {
    lines.push('  资金转移阶段: [信息不足] — 资金洗白的下游路径尚未确认。');
  }
  lines.push('');

  lines.push('四、关键证据');
  lines.push('');

  if (hasAutoAI) {
    lines.push('  1. AutoAI 操作日志 — 所有犯罪操作均由 app 在刘哲手机上自动执行');
    lines.push('  2. AutoAI 聊天记录 — 完整的招募过程（"林总"指挥刘哲）');
    lines.push('  3. AutoAI 截图 #0314-2215 — 控制端屏幕泄露外卖收货地址');
    if (hasLinYichen) {
      lines.push('  4. 住户查询 — 鹏程花园 4 栋 1703 承租人林奕辰');
      lines.push('  5. 领英/GitHub — 林奕辰具备完整的网络安全技术背景');
    }
    if (hasLiuZhe) {
      lines.push('  6. 受影响客户名单 — 刘哲出现在名单中（¥500 测试）');
    }
    if (hasChenFang) {
      lines.push('  7. 资金流水 — 完整的三层资金链条');
    }
  } else {
    lines.push('  [信息不足] — 远程操控相关证据缺失，无法生成关键证据清单。');
  }
  lines.push('');

  lines.push('五、结论与建议');
  lines.push('');

  if (hasLinYichen && hasAutoAI && hasLiuZhe && hasChenFang && hasPhishing) {
    lines.push('  本案为有预谋的凭证钓鱼 + AI 远程操控 + 多层人头隔离攻击。');
  } else {
    lines.push('  [信息不足 — 案件尚未完整，无法生成最终结论。]');
    lines.push('');
    lines.push('  当前缺失的关键信息：');
    if (!hasLinYichen) lines.push('    · 幕后主犯身份');
    if (!hasAutoAI) lines.push('    · 远程操控技术手段');
    if (!hasLiuZhe) lines.push('    · 人头身份信息');
    if (!hasChenFang) lines.push('    · 资金洗白下游路径');
    if (!hasPhishing) lines.push('    · 钓鱼攻击手法细节');
  }
  lines.push('');

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('');
  lines.push('  分析引擎: EDA v4.1');
  lines.push('  置信度: 低（信息不完整）');
  lines.push('  状态: 待补充');
  lines.push('');

  return lines.join('\n');
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
        output: generateIncompleteReport(contextTexts, required),
        triggersCaseClose: false,
        attemptCount,
        outputFile: undefined,
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
