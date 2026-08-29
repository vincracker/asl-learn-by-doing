import { describe, it, expect } from 'vitest'
import { trimToMotion } from './segment'
import { dtwDistance, type Sequence } from './dtw'
import { frameToFeature } from './normalize'
import { makeFrame, flatHand } from './testUtils'

const FACE = { centerX: 0.5, centerY: 0.3, width: 0.2 }
const at = (x: number, y: number) => frameToFeature(makeFrame(flatHand(x, y), { face: FACE }))

/** Frames held still at the start position. */
const still = (n: number, x = 0.5, y = 0.6) => Array.from({ length: n }, () => at(x, y))

/** The actual sign: hand travels from the temple outward. */
const signSpan = (n: number): Sequence =>
  Array.from({ length: n }, (_, i) => at(0.60 + 0.14 * (i / (n - 1)), 0.24))

/** A realistic take: rest, raise, sign, lower, rest. */
function take(leadFrames: number, tailFrames: number): Sequence {
  const raise = Array.from({ length: 6 }, (_, i) =>
    at(0.5 + 0.1 * (i / 5), 0.6 - 0.36 * (i / 5)),
  )
  const lower = Array.from({ length: 6 }, (_, i) =>
    at(0.74 - 0.24 * (i / 5), 0.24 + 0.36 * (i / 5)),
  )
  return [...still(leadFrames), ...raise, ...signSpan(20), ...lower, ...still(tailFrames)]
}

describe('trimToMotion', () => {
  it('drops the still frames at both ends', () => {
    const seq = [...still(20), ...signSpan(20), ...still(20)]
    const trimmed = trimToMotion(seq)
    expect(trimmed.length).toBeLessThan(seq.length * 0.6)
    expect(trimmed.length).toBeGreaterThan(10)
  })

  it('keeps a sequence that is motion throughout', () => {
    const seq = signSpan(30)
    expect(trimToMotion(seq).length).toBeGreaterThan(seq.length * 0.8)
  })

  it('returns the original when there is no motion to find', () => {
    const seq = still(30)
    expect(trimToMotion(seq)).toHaveLength(30)
  })

  it('never returns an empty or unusably short sequence', () => {
    expect(trimToMotion([]).length).toBe(0)
    expect(trimToMotion(still(3)).length).toBe(3)
    expect(trimToMotion([...still(40), ...signSpan(4)]).length).toBeGreaterThanOrEqual(4)
  })

  it('makes takes with different dead time far more similar', () => {
    // The real goal: two performances of the same sign, topped and tailed differently.
    const a = take(4, 30)
    const b = take(28, 6)

    const before = dtwDistance(a, b)
    const after = dtwDistance(trimToMotion(a), trimToMotion(b))

    expect(after).toBeLessThan(before / 3)
  })
})
