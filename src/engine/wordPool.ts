import type { Word } from '../content/scenarios'

/**
 * Picks the next phrase for a rush round.
 *
 * Never follows a word with one that needs the same hand shape: the player would still
 * be holding it from the last hit and would score without moving.
 */
export function pickNextWord(
  bank: readonly Word[],
  current: Word | null,
  random: () => number = Math.random,
): Word {
  const pool = bank.filter((w) => !current || w.gesture !== current.gesture)
  const src = pool.length ? pool : bank
  return src[Math.floor(random() * src.length)]
}
