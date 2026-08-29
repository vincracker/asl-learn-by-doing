import { DROPOUT_BRIDGE_MS, WINDOW_MS } from '../content/rules'

type Sample = { t: number; c: number }

/**
 * The rolling confidence window shared by every mode.
 *
 * Pure and copy-on-write: `pushSample` returns a new window rather than mutating, so a
 * round's scoring can be replayed frame-by-frame in a test with no timers involved.
 */
export type Window = {
  readonly samples: readonly Sample[]
  readonly lastGood: number
  readonly lastGoodAt: number
}

export const emptyWindow: Window = { samples: [], lastGood: 0, lastGoodAt: -Infinity }

export type WindowReading = {
  window: Window
  /** The confidence actually recorded, after the dropout bridge. */
  conf: number
  /** Mean confidence across the window. */
  rolling: number
  /**
   * Whether enough of a window sits behind the mean to trust it. Without this the
   * first frame after a word change would score off a mean of one sample.
   */
  settled: boolean
}

export function pushSample(
  w: Window,
  now: number,
  rawConf: number,
  windowMs = WINDOW_MS,
): WindowReading {
  // Bridge dropouts up to a quarter-second so one bad frame mid-hold doesn't drag
  // the rolling mean down.
  let conf = rawConf
  let lastGood = w.lastGood
  let lastGoodAt = w.lastGoodAt

  if (conf > 0) {
    lastGood = conf
    lastGoodAt = now
  } else if (now - lastGoodAt < DROPOUT_BRIDGE_MS) {
    conf = lastGood * 0.8
  }

  const samples = [...w.samples, { t: now, c: conf }].filter((s) => now - s.t <= windowMs)
  const rolling = samples.reduce((a, s) => a + s.c, 0) / Math.max(samples.length, 1)
  const settled = samples.length > 1 && now - samples[0].t >= windowMs * 0.75

  return { window: { samples, lastGood, lastGoodAt }, conf, rolling, settled }
}
