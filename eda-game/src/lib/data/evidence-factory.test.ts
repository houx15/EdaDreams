import { describe, it, expect } from 'vitest';
import {
  createMemoEvidence,
  createAttachmentEvidence,
  createToolEvidence,
  createPhoneEvidence,
  createForensicsEvidence,
  INITIAL_EVIDENCE,
  MEMO_EVIDENCE,
  ATTACHMENT_EVIDENCE,
} from './evidence-factory';

describe('evidence-factory', () => {
  describe('createMemoEvidence', () => {
    it('given memo params, when creating, then source type is memo', () => {
      const item = createMemoEvidence('memo_1', 'note.txt', 'note.txt', '1 KB');
      expect(item.source.type).toBe('memo');
      expect(item.tokenEstimate).toBe(200);
      expect(item.percentageEstimate).toBe(2);
    });
  });

  describe('createAttachmentEvidence', () => {
    it('given attachment params, when creating, then source type is attachment', () => {
      const item = createAttachmentEvidence('att_1', 'file.eml', 'file.eml', '5 KB');
      expect(item.source.type).toBe('attachment');
      expect(item.tokenEstimate).toBe(800);
    });
  });

  describe('createToolEvidence', () => {
    it('given tool params, when creating, then source contains toolId and query', () => {
      const item = createToolEvidence('tool_1', 'q.txt', 'q.txt', 'whois', 'domain.com', '1 KB', 150);
      expect(item.source.type).toBe('tool');
      expect(item.source.toolId).toBe('whois');
      expect(item.source.query).toBe('domain.com');
      expect(item.percentageEstimate).toBe(2);
    });
  });

  describe('createPhoneEvidence', () => {
    it('given phone params, when creating, then source contains lockId', () => {
      const item = createPhoneEvidence('phone_1', 'call.txt', 'call.txt', 'email_account', '2 KB', 300);
      expect(item.source.type).toBe('phone_call');
      expect(item.source.lockId).toBe('email_account');
    });
  });

  describe('createForensicsEvidence', () => {
    it('given forensics params, when creating, then source type is forensics_package', () => {
      const item = createForensicsEvidence('forensics_1', 'report.txt', 'report.txt', '3 KB', 500);
      expect(item.source.type).toBe('forensics_package');
      expect(item.percentageEstimate).toBe(5);
    });
  });

  describe('INITIAL_EVIDENCE', () => {
    it('given initial evidence, when reading, then contains briefing with correct source', () => {
      expect(INITIAL_EVIDENCE.length).toBe(1);
      expect(INITIAL_EVIDENCE[0].id).toBe('briefing_001');
      expect(INITIAL_EVIDENCE[0].source.type).toBe('briefing');
    });
  });

  describe('MEMO_EVIDENCE', () => {
    it('given memo evidence constant, when reading, then id is handover_note', () => {
      expect(MEMO_EVIDENCE.id).toBe('handover_note');
      expect(MEMO_EVIDENCE.filename).toBe('handover_note.txt');
    });
  });

  describe('ATTACHMENT_EVIDENCE', () => {
    it('given attachment constant, when reading, then id is phishing_sample', () => {
      expect(ATTACHMENT_EVIDENCE.id).toBe('phishing_sample');
      expect(ATTACHMENT_EVIDENCE.filename).toBe('phishing_sample.eml');
    });
  });
});
