import type { SearchEngineData, SearchResult } from '$lib/engine/types-v2';

export interface SearchMatch {
  result: SearchResult;
  relevance: number;
}

export function search(data: SearchEngineData, query: string): SearchResult[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) {
    return [];
  }

  const matches: SearchMatch[] = [];

  for (const result of data.results) {
    if (result.match.includes('_fallback')) {
      continue;
    }

    const isMatch = result.match.some((keyword) =>
      normalizedQuery.includes(keyword.toLowerCase()),
    );

    if (isMatch) {
      matches.push({
        result,
        relevance: result.useful ? 100 : 10,
      });
    }
  }

  if (matches.length === 0) {
    const fallback = data.results.find((r) => r.match.includes('_fallback'));
    if (fallback) {
      const noiseCount = Math.random() > 0.3 ? 1 : 2;
      for (let i = 0; i < noiseCount; i++) {
        matches.push({
          result: createFallbackResult(fallback, query),
          relevance: 1,
        });
      }
    }
  }

  matches.sort((a, b) => b.relevance - a.relevance);
  return matches.map((m) => m.result);
}

function createFallbackResult(template: SearchResult, query: string): SearchResult {
  return {
    ...template,
    id: `${template.id}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: template.title.replace('[搜索词]', query),
    summary: template.summary.replace('[根据搜索词动态生成一句百科风格的定义]', `关于"${query}"的公开信息较少。`),
  };
}
