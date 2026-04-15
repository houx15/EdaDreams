import type { EvidenceItem, EvidenceSource, ToolId } from '$lib/engine/types-v2';

export function createMemoEvidence(id: string, filename: string, displayName: string, sizeLabel: string): EvidenceItem {
  return {
    id,
    filename,
    displayName,
    source: { type: 'memo' },
    sizeLabel,
    tokenEstimate: 200,
    percentageEstimate: 2,
  };
}

export function createAttachmentEvidence(id: string, filename: string, displayName: string, sizeLabel: string): EvidenceItem {
  return {
    id,
    filename,
    displayName,
    source: { type: 'attachment' },
    sizeLabel,
    tokenEstimate: 800,
    percentageEstimate: 8,
  };
}

export function createToolEvidence(
  id: string,
  filename: string,
  displayName: string,
  toolId: ToolId,
  query: string,
  sizeLabel: string,
  tokenEstimate: number,
): EvidenceItem {
  return {
    id,
    filename,
    displayName,
    source: { type: 'tool', toolId, query },
    sizeLabel,
    tokenEstimate,
    percentageEstimate: Math.max(1, Math.round(tokenEstimate / 100)),
  };
}

export function createPhoneEvidence(
  id: string,
  filename: string,
  displayName: string,
  lockId: string,
  sizeLabel: string,
  tokenEstimate: number,
): EvidenceItem {
  return {
    id,
    filename,
    displayName,
    source: { type: 'phone_call', lockId },
    sizeLabel,
    tokenEstimate,
    percentageEstimate: Math.max(1, Math.round(tokenEstimate / 100)),
  };
}

export function createForensicsEvidence(
  id: string,
  filename: string,
  displayName: string,
  sizeLabel: string,
  tokenEstimate: number,
): EvidenceItem {
  return {
    id,
    filename,
    displayName,
    source: { type: 'forensics_package' },
    sizeLabel,
    tokenEstimate,
    percentageEstimate: Math.max(1, Math.round(tokenEstimate / 100)),
  };
}

export const INITIAL_EVIDENCE: EvidenceItem[] = [
  {
    id: 'briefing_001',
    filename: 'briefing_001.eml',
    displayName: 'briefing_001.eml',
    source: { type: 'briefing' },
    sizeLabel: '14 KB',
    tokenEstimate: 1200,
    percentageEstimate: 12,
  },
];

export const MEMO_EVIDENCE: EvidenceItem = createMemoEvidence(
  'handover_note',
  'handover_note.txt',
  'handover_note.txt',
  '1.2 KB',
);

export const ATTACHMENT_EVIDENCE: EvidenceItem = createAttachmentEvidence(
  'phishing_sample',
  'phishing_sample.eml',
  'phishing_sample.eml',
  '8.2 KB',
);
