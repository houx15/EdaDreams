import { describe, it, expect, beforeEach } from 'vitest';
import {
  setEvidenceContent,
  getEvidenceContent,
  clearEvidenceContentCache,
} from './evidence-content-cache';

describe('evidence-content-cache', () => {
  beforeEach(() => {
    clearEvidenceContentCache();
  });

  it('given an empty cache, when getting content, then returns undefined', () => {
    expect(getEvidenceContent('nonexistent')).toBeUndefined();
  });

  it('given content is set, when getting by id, then returns the content', () => {
    setEvidenceContent('whois_test', 'domain: test.com');
    expect(getEvidenceContent('whois_test')).toBe('domain: test.com');
  });

  it('given multiple items, when getting each, then returns correct values', () => {
    setEvidenceContent('a', 'content-a');
    setEvidenceContent('b', 'content-b');
    expect(getEvidenceContent('a')).toBe('content-a');
    expect(getEvidenceContent('b')).toBe('content-b');
  });

  it('given content is set, when clearing cache, then get returns undefined', () => {
    setEvidenceContent('x', 'data');
    clearEvidenceContentCache();
    expect(getEvidenceContent('x')).toBeUndefined();
  });

  it('given same id is set twice, when getting, then returns latest value', () => {
    setEvidenceContent('same', 'first');
    setEvidenceContent('same', 'second');
    expect(getEvidenceContent('same')).toBe('second');
  });
});
