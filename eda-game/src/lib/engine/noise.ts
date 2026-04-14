export interface NoiseEffect {
  noiseWord: string
  blockIndex: number
  insertionPoint: 'prefix' | 'suffix'
}

export function detectNoise(
  contextTexts: string[],
  noiseWords: string[],
): NoiseEffect[] {
  if (contextTexts.length === 0 || noiseWords.length === 0) return []

  const effects: NoiseEffect[] = []
  const seen = new Set<string>()

  contextTexts.forEach((text, blockIndex) => {
    for (const noiseWord of noiseWords) {
      const key = `${blockIndex}:${noiseWord}`
      if (text.includes(noiseWord) && !seen.has(key)) {
        seen.add(key)
        effects.push({
          noiseWord,
          blockIndex,
          insertionPoint: 'suffix',
        })
      }
    }
  })

  return effects
}
