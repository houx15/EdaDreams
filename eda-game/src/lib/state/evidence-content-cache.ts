const cache = new Map<string, string>();

export function setEvidenceContent(id: string, content: string): void {
  cache.set(id, content);
}

export function getEvidenceContent(id: string): string | undefined {
  return cache.get(id);
}

export function clearEvidenceContentCache(): void {
  cache.clear();
}
