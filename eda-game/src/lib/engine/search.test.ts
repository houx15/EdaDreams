import { describe, it, expect } from 'vitest';
import { search } from './search';
import type { SearchEngineData, SearchResult } from './types-v2';

const TEST_RESULTS: SearchResult[] = [
  {
    id: 'tool_whois',
    match: ['域名查询', 'WHOIS'],
    title: 'CNNIC WHOIS 查询',
    source: 'whois.cnnic-query.cn',
    summary: '提供域名注册信息查询。',
    useful: true,
    clickable: true,
    opens: 'whois_tool',
  },
  {
    id: 'lu_contact',
    match: ['东海银行 陆明远', '陆明远 东海'],
    title: '东海银行网络安全响应中心',
    source: 'donghai-bank.com',
    summary: '高级安全工程师：陆明远（联系电话 0755-8800-1234）',
    useful: true,
    key_clue: '陆明远的电话号码',
  },
  {
    id: 'liuzhe_noise',
    match: ['刘哲 深圳'],
    title: '刘哲 — 深圳大学副教授',
    source: 'szu.edu.cn',
    summary: '同名人，大学教授',
    useful: false,
    noise_note: '噪音',
  },
  {
    id: 'generic_fallback_1',
    match: ['_fallback'],
    title: '百度百科 — [搜索词]',
    source: '百度百科',
    summary: '[根据搜索词动态生成一句百科风格的定义]',
    useful: false,
    noise_note: '兜底噪音',
  },
];

const TEST_DATA: SearchEngineData = {
  _meta: {
    description: '',
    matching_rule: '',
    click_behavior: '',
  },
  results: TEST_RESULTS,
};

describe('search', () => {
  it('returns empty array for empty query', () => {
    const results = search(TEST_DATA, '');
    expect(results).toHaveLength(0);
  });

  it('finds WHOIS tool for "域名查询"', () => {
    const results = search(TEST_DATA, '域名查询');
    expect(results.some((r) => r.id === 'tool_whois')).toBe(true);
  });

  it('finds Lu Mingyuan contact for "东海银行 陆明远"', () => {
    const results = search(TEST_DATA, '东海银行 陆明远');
    expect(results.some((r) => r.id.startsWith('lu_contact'))).toBe(true);
    expect(results[0].useful).toBe(true);
  });

  it('sorts useful results before noise', () => {
    const results = search(TEST_DATA, '刘哲 深圳');
    const usefulIndex = results.findIndex((r) => r.useful);
    const noiseIndex = results.findIndex((r) => !r.useful && !r.id.includes('fallback'));
    expect(usefulIndex).toBeLessThan(noiseIndex);
  });

  it('returns fallback results for unmatched queries', () => {
    const results = search(TEST_DATA, '完全无关的搜索词');
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].id.startsWith('generic_fallback')).toBe(true);
  });
});
