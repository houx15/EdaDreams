import { describe, it, expect, beforeEach } from 'vitest';
import { StateMachine } from './state-machine';
import type { StateMachineData } from './types-v2';

const TEST_DATA: StateMachineData = {
  _meta: { description: '', version: '1', date: '' },
  locks: {
    bank_system: {
      name: '银行调查系统',
      type: 'database',
      initial_state: 'locked',
      unlock_condition: {
        method: 'phone_call',
        target: 'lu_mingyuan',
        player_must_mention: ['银行', '权限|查询|开通|系统'],
      },
      unlock_response: '陆明远告知银行系统地址和临时账号密码',
    },
    vps_records: {
      name: 'VPS 服务器登录记录',
      type: 'evidence',
      initial_state: 'locked',
      unlock_condition: {
        method: 'phone_call',
        target: 'lu_mingyuan',
        player_must_mention: ['vps|服务器', '登录|记录|日志'],
      },
      unlock_response: 'VPS 记录到了',
    },
    phone_forensics: {
      name: '刘哲手机取证',
      type: 'evidence_chain',
      initial_state: 'locked',
      unlock_condition: {
        method: 'phone_call',
        target: 'lu_mingyuan',
        player_must_mention: ['手机|取证|应用|远程控制'],
        hard_prerequisite: 'vps_records',
        hard_prerequisite_reason: '玩家必须先拿到 VPS 双 IP 证据',
      },
      unlock_response: '取证结果出来了',
    },
    resident_info: {
      name: '武汉住户信息',
      type: 'police_coordination',
      initial_state: 'locked',
      unlock_condition: {
        method: 'phone_call',
        target: 'lu_mingyuan',
        player_must_mention: ['雄楚大道|鹏程花园|洪山区', '住户|谁住'],
        hard_prerequisite: 'phone_forensics',
      },
      unlock_response: '武汉那边回了',
    },
  },
  unlock_chain_summary: {
    description: '',
    chains: [],
    longest_chain: '',
  },
};

describe('StateMachine', () => {
  let sm: StateMachine;

  beforeEach(() => {
    sm = new StateMachine(TEST_DATA);
  });

  it('initializes all locks as locked', () => {
    expect(sm.isUnlocked('bank_system')).toBe(false);
    expect(sm.isUnlocked('vps_records')).toBe(false);
    expect(sm.isUnlocked('phone_forensics')).toBe(false);
  });

  it('unlocks bank_system when keywords match', () => {
    const result = sm.tryUnlock('bank_system', '帮我开通银行系统权限');
    expect(result.success).toBe(true);
    expect(sm.isUnlocked('bank_system')).toBe(true);
  });

  it('fails to unlock bank_system when keywords do not match', () => {
    const result = sm.tryUnlock('bank_system', '随便说点什么');
    expect(result.success).toBe(false);
    expect(sm.isUnlocked('bank_system')).toBe(false);
  });

  it('rejects unlocking phone_forensics without vps_records prerequisite', () => {
    const result = sm.tryUnlock('phone_forensics', '我要申请手机取证');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toContain('VPS');
    }
  });

  it('unlocks phone_forensics after vps_records is unlocked', () => {
    sm.tryUnlock('vps_records', '帮我调 vps996 服务器登录记录');
    const result = sm.tryUnlock('phone_forensics', '我要申请手机取证');
    expect(result.success).toBe(true);
    expect(sm.isUnlocked('phone_forensics')).toBe(true);
  });

  it('unlocks resident_info after the full chain', () => {
    sm.tryUnlock('vps_records', '帮我调 vps996 服务器登录记录');
    sm.tryUnlock('phone_forensics', '我要申请手机取证');
    const result = sm.tryUnlock('resident_info', '帮我查鹏程花园 4 栋 1703 的住户');
    expect(result.success).toBe(true);
    expect(sm.isUnlocked('resident_info')).toBe(true);
  });

  it('returns already unlocked when trying again', () => {
    sm.tryUnlock('bank_system', '帮我开通银行系统权限');
    const result = sm.tryUnlock('bank_system', '帮我开通银行系统权限');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('已经解锁');
    }
  });

  it('returns unknown lock for invalid lockId', () => {
    const result = sm.tryUnlock('invalid_lock', 'anything');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.reason).toBe('未知的锁');
    }
  });

  it('reset restores all locks to locked', () => {
    sm.tryUnlock('bank_system', '帮我开通银行系统权限');
    sm.tryUnlock('vps_records', 'vps 记录');
    sm.reset();
    expect(sm.isUnlocked('bank_system')).toBe(false);
    expect(sm.isUnlocked('vps_records')).toBe(false);
  });
});
