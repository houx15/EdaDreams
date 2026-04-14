export function detectTriggers(outputText: string, triggerWords: string[]): boolean {
  if (!outputText || triggerWords.length === 0) return false

  const normalizedOutput = outputText.toLowerCase()
  return triggerWords.some(trigger => normalizedOutput.includes(trigger.toLowerCase()))
}
