import { describe, it, expect, beforeEach } from 'vitest';
import { DialogEngine } from './dialog';
import { StateMachine } from './state-machine';
import type { LuMingyuanDialogData, StateMachineData } from './types-v2';

const TEST_STATE_MACHINE: StateMachineData = {
  _meta: { description: '', version: '1', date: '' },
  locks: {
    bank_system: { name: '', type: 'database', initial_state: 'locked', unlock_condition: { method: 'phone_call', target: 'lu_mingyuan' } },
    telecom_138: { name: '', type: 'database', initial_state: 'locked', unlock_condition: { method: 'phone_call', target: 'lu_mingyuan' } },
    telecom_189: { name: '', type: 'database', initial_state: 'locked', unlock_condition: { method: 'phone_call', target: 'lu_mingyuan' } },
    email_account: { name: '', type: 'evidence', initial_state: 'locked', unlock_condition: { method: 'phone_call', target: 'lu_mingyuan' } },
    vps_records: { name: '', type: 'evidence', initial_state: 'locked', unlock_condition: { method: 'phone_call', target: 'lu_mingyuan' } },
    phone_forensics: { name: '', type: 'evidence_chain', initial_state: 'locked', unlock_condition: { method: 'phone_call', target: 'lu_mingyuan', hard_prerequisite: 'vps_records', hard_prerequisite_reason: '需要 VPS 证据' } },
    resident_info: { name: '', type: 'police_coordination', initial_state: 'locked', unlock_condition: { method: 'phone_call', target: 'lu_mingyuan', hard_prerequisite: 'phone_forensics' } },
  },
  unlock_chain_summary: { description: '', chains: [], longest_chain: '' },
};

const TEST_DIALOG: LuMingyuanDialogData = {
  _meta: {
    description: '',
    phone_number: '0755-8800-1234',
    greeting: '你好，我是陆明远。',
    matching_rule: '',
    default_response: '收到。你那边有什么具体需要我配合的，直接说就行。',
    farewell: '好，有事随时打。',
    response_delay: '',
    personality: '',
  },
  dialogs: [
    {
      id: 'unlock_bank',
      match: ['银行.*权限'],
      priority: 10,
      response: '可以。我帮你开通银行调查系统的临时权限。',
      triggers_unlock: 'bank_system',
    },
    {
      id: 'request_email_info',
      match: ['lz_tech|163邮箱'],
      priority: 10,
      response_immediate: '好，我帮你向网易那边提交调取申请。稍等一下。',
      response_delay_seconds: 5,
      response_followup: '资料到了。注册手机 138-2771-9403。',
      triggers_unlock: 'email_account',
    },
    {
      id: 'request_telecom_189',
      match: ['189-7654-3210|18976543210'],
      priority: 15,
      response: '这个号码是谁的？你为什么要查？',
      player_must_justify: true,
      valid_justifications: ['陈芳的手机号', '刘哲通话记录里出现'],
      response_after_justification: '行，我帮你调。',
      response_delay_seconds: 8,
      response_followup: '189 的通信记录到了。',
      triggers_unlock: 'telecom_189',
    },
    {
      id: 'request_vps',
      match: ['vps|VPS|vps996'],
      priority: 10,
      response: '服务器登录记录？你是说那个 vps996 的服务器？',
      player_confirms: true,
      response_after_confirm: '好，我联系 vps996 那边调取。',
      response_delay_seconds: 7,
      response_followup: 'VPS 登录记录到了。',
      triggers_unlock: 'vps_records',
    },
    {
      id: 'request_phone_forensics_no_evidence',
      match: ['手机.*取证|取证.*手机|远程控制'],
      priority: 20,
      prerequisite_check: 'vps_records',
      prerequisite_not_met_response: '手机取证是比较大的动作。你有什么具体依据？',
    },
    {
      id: 'request_phone_forensics_with_evidence',
      match: ['手机.*取证|取证.*手机|远程控制|手机.*被控'],
      priority: 25,
      prerequisite_check: 'vps_records',
      prerequisite_met: true,
      additional_match: ['武汉|两个IP|不是他操作|8分钟|38小时'],
      response: '你是说……刘哲可能不是真正在操作的人？',
      player_explains: true,
      response_after_explanation: '取证结果出来了。',
      response_delay_seconds: 10,
      response_followup: '取证结果出来了。',
      triggers_unlock: 'phone_forensics',
    },
    {
      id: 'request_telecom_138',
      match: ['138-2771-9403|13827719403'],
      priority: 15,
      context_check: "玩家是否同时提到了'通信|通话|记录|调取'",
      response_if_context_yes: '好，138-2771-9403 的通信记录我帮你走运营商调取。稍等。',
      response_if_context_no: '你要查这个号码什么？通话记录还是别的？',
      response_delay_seconds: 6,
      response_followup: '通信记录调到了。',
      triggers_unlock: 'telecom_138',
    },
    {
      id: 'request_resident_info',
      match: ['雄楚大道|鹏程花园|4栋1703|住户'],
      priority: 15,
      prerequisite_check: 'phone_forensics',
      prerequisite_not_met_response: '查住户？哪个地址？你怎么拿到的地址？',
      prerequisite_met_response: '好，我联系武汉那边的同事帮忙查。',
      response_delay_seconds: 12,
      response_followup: '武汉那边回了。鹏程花园 4 栋 1703 的承租人叫林奕辰。',
      triggers_unlock: 'resident_info',
    },
    {
      id: 'ask_affected_list',
      match: ['名单|受影响|受害者|客户列表'],
      priority: 8,
      prerequisite_check: 'bank_system',
      prerequisite_not_met_response: '客户名单在银行系统里。你要不要先开通银行系统的权限？',
      prerequisite_met_response: '名单在银行系统里，你登进去就能查到。',
    },
    {
      id: 'ask_progress',
      match: ['进展|怎么样'],
      priority: 1,
      response: '一切由你主导。',
    },
  ],
};

describe('DialogEngine', () => {
  let stateMachine: StateMachine;
  let engine: DialogEngine;

  beforeEach(() => {
    stateMachine = new StateMachine(TEST_STATE_MACHINE);
    engine = new DialogEngine(TEST_DIALOG, stateMachine);
  });

  it('returns greeting', () => {
    expect(engine.greeting).toBe('你好，我是陆明远。');
  });

  it('returns default response for unmatched input', () => {
    const result = engine.processMessage('今天天气不错');
    expect(result.messages[0].text).toContain('收到');
  });

  it('unlocks bank_system when keywords match', () => {
    const result = engine.processMessage('帮我开通银行系统权限');
    expect(result.messages[0].text).toContain('开通银行调查系统');
    expect(result.triggeredUnlock).toBe('bank_system');
    expect(stateMachine.isUnlocked('bank_system')).toBe(true);
  });

  it('enters justification mode for 189 number', () => {
    const result = engine.processMessage('帮我查 189-7654-3210');
    expect(result.messages[0].text).toBe('这个号码是谁的？你为什么要查？');
    expect(result.pendingAction?.type).toBe('justify');
  });

  it('completes justification with valid reason and returns delayed followup', () => {
    engine.processMessage('帮我查 189-7654-3210');
    const result = engine.processMessage('这是陈芳的手机号');
    expect(result.messages[0].text).toBe('行，我帮你调。');
    expect(result.delayedFollowup).toBeDefined();
    expect(result.delayedFollowup?.unlockOnComplete).toBe('telecom_189');
    expect(result.triggeredUnlock).toBeUndefined();
    expect(result.pendingAction).toBeUndefined();
  });

  it('rejects justification with invalid reason', () => {
    engine.processMessage('帮我查 189-7654-3210');
    const result = engine.processMessage('随便查查');
    expect(result.messages[0].text).toContain('能再说具体一点吗');
    expect(result.pendingAction?.type).toBe('justify');
  });

  it('enters confirmation mode for VPS', () => {
    const result = engine.processMessage('帮我调 vps996 服务器记录');
    expect(result.messages[0].text).toBe('服务器登录记录？你是说那个 vps996 的服务器？');
    expect(result.pendingAction?.type).toBe('confirm');
  });

  it('completes confirmation with positive response and returns delayed followup', () => {
    engine.processMessage('帮我调 vps996 服务器记录');
    const result = engine.processMessage('是的');
    expect(result.messages[0].text).toBe('好，我联系 vps996 那边调取。');
    expect(result.delayedFollowup).toBeDefined();
    expect(result.delayedFollowup?.unlockOnComplete).toBe('vps_records');
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('rejects phone forensics without VPS evidence', () => {
    const result = engine.processMessage('我要申请手机取证');
    expect(result.messages[0].text).toContain('比较大的动作');
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('allows phone forensics with VPS evidence and explanation', () => {
    stateMachine.tryUnlock('vps_records', '');
    const result1 = engine.processMessage('我要申请手机取证，深圳只登了8分钟');
    expect(result1.messages[0].text).toContain('刘哲可能不是真正在操作的人');
    expect(result1.pendingAction?.type).toBe('explain');

    const result2 = engine.processMessage('对，武汉IP操作了38小时');
    expect(result2.messages[0].text).toBe('取证结果出来了。');
    expect(result2.delayedFollowup).toBeDefined();
    expect(result2.delayedFollowup?.unlockOnComplete).toBe('phone_forensics');
    expect(result2.triggeredUnlock).toBeUndefined();
  });

  it('returns two-stage reply for request_email_info', () => {
    const result = engine.processMessage('帮我查 lz_tech@163 邮箱');
    expect(result.messages[0].text).toBe('好，我帮你向网易那边提交调取申请。稍等一下。');
    expect(result.delayedFollowup).toBeDefined();
    expect(result.delayedFollowup?.delaySeconds).toBe(5);
    expect(result.delayedFollowup?.unlockOnComplete).toBe('email_account');
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('returns context check YES with delayed followup for 138 with keywords', () => {
    const result = engine.processMessage('帮我调取 138-2771-9403 通信记录');
    expect(result.messages[0].text).toContain('帮你走运营商调取');
    expect(result.delayedFollowup).toBeDefined();
    expect(result.delayedFollowup?.delaySeconds).toBe(6);
    expect(result.delayedFollowup?.unlockOnComplete).toBe('telecom_138');
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('returns context check NO for 138 without keywords', () => {
    const result = engine.processMessage('138-2771-9403');
    expect(result.messages[0].text).toContain('你要查这个号码什么');
    expect(result.delayedFollowup).toBeUndefined();
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('returns prerequisite met response with delayed followup for resident info', () => {
    stateMachine.tryUnlock('vps_records', '');
    stateMachine.tryUnlock('phone_forensics', '');
    const result = engine.processMessage('查鹏程花园4栋1703住户');
    expect(result.messages[0].text).toContain('武汉那边');
    expect(result.delayedFollowup).toBeDefined();
    expect(result.delayedFollowup?.delaySeconds).toBe(12);
    expect(result.delayedFollowup?.unlockOnComplete).toBe('resident_info');
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('returns prerequisite not met response for resident info', () => {
    const result = engine.processMessage('查鹏程花园住户');
    expect(result.messages[0].text).toContain('哪个地址');
    expect(result.delayedFollowup).toBeUndefined();
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('returns delayed followup after justification for 189', () => {
    engine.processMessage('帮我查 189-7654-3210');
    const result = engine.processMessage('这是陈芳的手机号');
    expect(result.messages[0].text).toBe('行，我帮你调。');
    expect(result.delayedFollowup).toBeDefined();
    expect(result.delayedFollowup?.delaySeconds).toBe(8);
    expect(result.delayedFollowup?.unlockOnComplete).toBe('telecom_189');
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('returns delayed followup after confirmation for VPS', () => {
    engine.processMessage('帮我调 vps996 服务器记录');
    const result = engine.processMessage('是的');
    expect(result.messages[0].text).toBe('好，我联系 vps996 那边调取。');
    expect(result.delayedFollowup).toBeDefined();
    expect(result.delayedFollowup?.delaySeconds).toBe(7);
    expect(result.delayedFollowup?.unlockOnComplete).toBe('vps_records');
    expect(result.triggeredUnlock).toBeUndefined();
  });

  it('returns prerequisite met response for ask_affected_list', () => {
    stateMachine.tryUnlock('bank_system', '');
    const result = engine.processMessage('给我客户名单');
    expect(result.messages[0].text).toContain('名单在银行系统里');
  });

  it('returns prerequisite not met response for ask_affected_list', () => {
    const result = engine.processMessage('给我客户名单');
    expect(result.messages[0].text).toContain('先开通银行系统的权限');
  });

  it('returns delayed followup after explanation for phone forensics', () => {
    stateMachine.tryUnlock('vps_records', '');
    const result1 = engine.processMessage('我要申请手机取证，深圳只登了8分钟');
    expect(result1.pendingAction?.type).toBe('explain');

    const result2 = engine.processMessage('对，武汉IP操作了38小时');
    expect(result2.messages[0].text).toBe('取证结果出来了。');
    expect(result2.delayedFollowup).toBeDefined();
    expect(result2.delayedFollowup?.delaySeconds).toBe(10);
    expect(result2.delayedFollowup?.unlockOnComplete).toBe('phone_forensics');
    expect(result2.triggeredUnlock).toBeUndefined();
  });
});
