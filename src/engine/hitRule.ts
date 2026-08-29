/**
 * Whether this frame clears the current word.
 *
 * Three conditions, and all three matter:
 *  - `settled`: most of a window sits behind the mean, so the first frame after a word
 *    change can't score off a single sample.
 *  - the cooldown has expired, so one continuous hold can't clear two words in a row
 *    without the player moving.
 *  - the rolling mean is at or above the mode's bar.
 */
export function isHit(opts: {
  settled: boolean
  rolling: number
  pass: number
  now: number
  cooldownUntil: number
}): boolean {
  const { settled, rolling, pass, now, cooldownUntil } = opts
  return settled && now >= cooldownUntil && rolling >= pass
}
