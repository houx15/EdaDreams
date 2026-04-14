import { describe, it, expect } from 'vitest';
import { BRIEFING_EMAIL, ANALYSIS_001_TEMPLATE, ACCEPT_BUTTON_TEXT } from './case00';

describe('case00.ts', () => {
  describe('BRIEFING_EMAIL', () => {
    it('given briefing email, when checking case number, then contains CASE-2041-0001', () => {
      expect(BRIEFING_EMAIL.content).toContain('CASE-2041-0001');
    });

    it('given briefing email, when checking client name, then contains 东海银行', () => {
      expect(BRIEFING_EMAIL.content).toContain('东海银行');
    });

    it('given briefing email, when checking metadata, then has correct id and filename', () => {
      expect(BRIEFING_EMAIL.id).toBe('briefing_001');
      expect(BRIEFING_EMAIL.filename).toBe('briefing_001.eml');
    });

    it('given briefing email, when checking evidence number, then is 0 for boot evidence', () => {
      expect(BRIEFING_EMAIL.evidenceNumber).toBe(0);
    });

    it('given briefing email, when checking content completeness, then contains all six sections', () => {
      expect(BRIEFING_EMAIL.content).toContain('一、案件编号');
      expect(BRIEFING_EMAIL.content).toContain('二、委托方');
      expect(BRIEFING_EMAIL.content).toContain('三、事件概述');
      expect(BRIEFING_EMAIL.content).toContain('四、已有证据');
      expect(BRIEFING_EMAIL.content).toContain('五、你的目标');
      expect(BRIEFING_EMAIL.content).toContain('六、权限与约束');
    });

    it('given briefing email, when checking victim statistics, then contains key numbers', () => {
      expect(BRIEFING_EMAIL.content).toContain('1,183');
      expect(BRIEFING_EMAIL.content).toContain('47');
      expect(BRIEFING_EMAIL.content).toContain('11');
      expect(BRIEFING_EMAIL.content).toContain('384,000');
    });

    it('given briefing email, when checking contact person, then mentions 陆明远', () => {
      expect(BRIEFING_EMAIL.content).toContain('陆明远');
    });

    it('given briefing email, when checking token estimate, then has reasonable percentage', () => {
      expect(BRIEFING_EMAIL.tokenEstimate).toBeGreaterThan(0);
      expect(BRIEFING_EMAIL.percentageEstimate).toBeGreaterThan(0);
    });
  });

  describe('ANALYSIS_001_TEMPLATE', () => {
    it('given analysis template, when checking content, then is non-empty', () => {
      expect(ANALYSIS_001_TEMPLATE.length).toBeGreaterThan(0);
    });

    it('given analysis template, when checking attack type, then contains 凭证钓鱼', () => {
      expect(ANALYSIS_001_TEMPLATE).toContain('凭证钓鱼');
    });

    it('given analysis template, when checking case number, then contains CASE-2041-0001', () => {
      expect(ANALYSIS_001_TEMPLATE).toContain('CASE-2041-0001');
    });

    it('given analysis template, when checking structure, then has all five sections', () => {
      expect(ANALYSIS_001_TEMPLATE).toContain('一、案件识别');
      expect(ANALYSIS_001_TEMPLATE).toContain('二、攻击链');
      expect(ANALYSIS_001_TEMPLATE).toContain('三、需要获取的证据');
      expect(ANALYSIS_001_TEMPLATE).toContain('四、当前状态');
      expect(ANALYSIS_001_TEMPLATE).toContain('五、建议');
    });

    it('given analysis template, when checking context capability mention, then notes context-only limitation', () => {
      expect(ANALYSIS_001_TEMPLATE).toContain('context');
    });
  });

  describe('ACCEPT_BUTTON_TEXT', () => {
    it('given accept button text, when checking value, then equals 接受案件', () => {
      expect(ACCEPT_BUTTON_TEXT).toBe('接受案件');
    });
  });
});
