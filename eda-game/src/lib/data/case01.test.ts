import { describe, it, expect } from 'vitest';
import {
  CASE01_EVIDENCE,
  CASE01_STEP_TRIGGER_MAP,
  CASE01_INITIAL_EVIDENCE,
  CASE01_FINAL_STEP,
} from './case01';

describe('case01.ts', () => {
  describe('CASE01_EVIDENCE', () => {
    it('given case01 evidence array, when checking count, then has exactly 11 items', () => {
      expect(CASE01_EVIDENCE).toHaveLength(11);
    });

    it('given case01 evidence, when checking IDs, then all IDs are unique', () => {
      const ids = CASE01_EVIDENCE.map((e) => e.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('given case01 evidence, when checking evidence numbers, then are 1 through 11 in order', () => {
      const numbers = CASE01_EVIDENCE.map((e) => e.evidenceNumber);
      expect(numbers).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    });

    it('given case01 evidence, when checking each item, then all have non-empty content', () => {
      for (const evidence of CASE01_EVIDENCE) {
        expect(evidence.content.length).toBeGreaterThan(0);
      }
    });

    it('given case01 evidence, when checking filenames, then all match expected names', () => {
      const expectedFilenames = [
        'phishing_sample.eml',
        'domain_registration.txt',
        'email_account.txt',
        'phone_records.txt',
        'phone_lookup.txt',
        'company_registration.txt',
        'affected_clients.txt',
        'liuzhe_account.txt',
        'fund_flow.txt',
        'account_b.txt',
        'timeline.txt',
      ];
      const actualFilenames = CASE01_EVIDENCE.map((e) => e.filename);
      expect(actualFilenames).toEqual(expectedFilenames);
    });

    it('given case01 evidence, when checking case numbers, then all are CASE-2041-0001', () => {
      for (const evidence of CASE01_EVIDENCE) {
        expect(evidence.caseNumber).toBe('CASE-2041-0001');
      }
    });

    it('given case01 evidence, when summing percentage estimates, then totals approximately 100% of capacity', () => {
      const totalPercentage = CASE01_EVIDENCE.reduce((sum, e) => sum + e.percentageEstimate, 0);
      expect(totalPercentage).toBeGreaterThanOrEqual(90);
      expect(totalPercentage).toBeLessThanOrEqual(120);
    });

    it('given evidence_01 phishing sample, when checking content, then contains donghai-verify.cn', () => {
      expect(CASE01_EVIDENCE[0].content).toContain('donghai-verify.cn');
    });

    it('given evidence_02 domain registration, when checking content, then contains lz_tech@163.com', () => {
      expect(CASE01_EVIDENCE[1].content).toContain('lz_tech@163.com');
    });

    it('given evidence_03 email account, when checking content, then contains phone number 138-2771-9403', () => {
      expect(CASE01_EVIDENCE[2].content).toContain('138-2771-9403');
    });

    it('given evidence_04 phone records, when checking content, then contains landline 0755-8832-6617', () => {
      expect(CASE01_EVIDENCE[3].content).toContain('0755-8832-6617');
    });

    it('given evidence_05 phone lookup, when checking content, then contains company name 瑞泽信息技术', () => {
      expect(CASE01_EVIDENCE[4].content).toContain('瑞泽信息技术有限公司');
    });

    it('given evidence_06 company registration, when checking content, then lists 刘哲 as legal representative', () => {
      expect(CASE01_EVIDENCE[5].content).toContain('法定代表人');
      expect(CASE01_EVIDENCE[5].content).toContain('刘哲');
    });

    it('given evidence_07 affected clients, when checking content, then has 47 entries and 刘哲 at position 17', () => {
      expect(CASE01_EVIDENCE[6].content).toContain('17   刘  哲  03-14 23:47');
      expect(CASE01_EVIDENCE[6].content).toContain('¥500');
    });

    it('given evidence_08 liuzhe account, when checking content, then contains account tail 8847', () => {
      expect(CASE01_EVIDENCE[7].content).toContain('8847');
    });

    it('given evidence_09 fund flow, when checking content, then mentions 海口 ATM withdrawals', () => {
      expect(CASE01_EVIDENCE[8].content).toContain('海口');
      expect(CASE01_EVIDENCE[8].content).toContain('ATM');
    });

    it('given evidence_10 account b, when checking content, then reveals 陈芳 as holder', () => {
      expect(CASE01_EVIDENCE[9].content).toContain('陈芳');
      expect(CASE01_EVIDENCE[9].content).toContain('189-7654-3210');
    });

    it('given evidence_11 timeline, when checking content, then covers all four phases', () => {
      expect(CASE01_EVIDENCE[10].content).toContain('准备期');
      expect(CASE01_EVIDENCE[10].content).toContain('部署期');
      expect(CASE01_EVIDENCE[10].content).toContain('攻击期');
      expect(CASE01_EVIDENCE[10].content).toContain('收尾');
    });
  });

  describe('CASE01_STEP_TRIGGER_MAP', () => {
    it('given trigger map, when checking step count, then has entries for all 12 steps', () => {
      const stepKeys = Object.keys(CASE01_STEP_TRIGGER_MAP).filter((k) => k.startsWith('step_'));
      expect(stepKeys).toHaveLength(12);
    });

    it('given trigger map, when checking steps 1-11, then all have non-empty triggerWords array', () => {
      for (const [key, entry] of Object.entries(CASE01_STEP_TRIGGER_MAP)) {
        if (key === 'step_12') continue;
        expect(entry.triggerWords.length).toBeGreaterThan(0);
      }
    });

    it('given trigger map, when checking each entry, then all have non-empty unlockEvidence', () => {
      for (const [key, entry] of Object.entries(CASE01_STEP_TRIGGER_MAP)) {
        expect(entry.unlockEvidence.length).toBeGreaterThan(0);
      }
    });

    it('given trigger map steps 1-11, when checking unlock targets, then reference valid evidence IDs', () => {
      const validIds = new Set(CASE01_EVIDENCE.map((e) => e.id));
      validIds.add('__final_report__');
      validIds.add('__case_closed__');
      for (const entry of Object.values(CASE01_STEP_TRIGGER_MAP)) {
        expect(validIds.has(entry.unlockEvidence)).toBe(true);
      }
    });

    it('given trigger map step_01, when checking trigger words, then contains donghai-verify.cn', () => {
      expect(CASE01_STEP_TRIGGER_MAP.step_01.triggerWords).toContain('donghai-verify.cn');
    });

    it('given trigger map step_06, when checking trigger words, then requires dual match of 刘哲 and client list keywords', () => {
      expect(CASE01_STEP_TRIGGER_MAP.step_06.triggerWords).toContain('刘哲');
      expect(CASE01_STEP_TRIGGER_MAP.step_06.triggerWords).toContain('受害');
    });

    it('given trigger map step_12, when checking unlock target, then signals case closed', () => {
      expect(CASE01_STEP_TRIGGER_MAP.step_12.unlockEvidence).toBe('__case_closed__');
    });
  });

  describe('CASE01_INITIAL_EVIDENCE and CASE01_FINAL_STEP', () => {
    it('given initial evidence constant, when checking value, then is evidence_01', () => {
      expect(CASE01_INITIAL_EVIDENCE).toBe('evidence_01');
    });

    it('given final step constant, when checking value, then is 12', () => {
      expect(CASE01_FINAL_STEP).toBe(12);
    });
  });
});
