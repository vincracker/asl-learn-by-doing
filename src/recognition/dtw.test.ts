import { describe, it, expect } from 'vitest'
import { dtwDistance, frameDistance, resample, RESAMPLE_LEN, type Sequence } from './dtw'
import { frameToFeature, HAND_LEN } from './normalize'
import { makeHand, makeFrame, translate } from './testUtils'

/** A moving-hand sequence: the hand drifts upward over `n` frames. */
function makeSequence(n: number, seed = 1, drift = 0.3): Sequence {
  const hand = makeHand(seed)
  return Array.from({ length: n }, (_, i) =>
    frameToFeature(makeFrame(translate(hand, 0, -drift * (i / (n - 1))))),
  )
}

describe('frameDistance', () => {
  it('is zero for identical frames', () => {
    const f = frameToFeature(makeFrame(makeHand()))
    expect(frameDistance(f, f)).toBe(0)
  })

  it('charges a penalty when one frame has a hand the other lacks', () => {
    const oneHand = frameToFeature(makeFrame(makeHand(), { handedness: 'Right' }))
    const otherHand = frameToFeature(makeFrame(makeHand(), { handedness: 'Left' }))
    // Both hands disagree on presence -> two penalties.
    expect(frameDistance(oneHand, otherHand)).toBeCloseTo(3.0, 5)
  })

  it('ignores the zero-filled slots of an absent hand', () => {
    const a = frameToFeature(makeFrame(makeHand(1), { handedness: 'Right' }))
    const b = frameToFeature(makeFrame(makeHand(2), { handedness: 'Right' }))
    // Left-hand slots are zero in both and must not contribute.
    expect(a[HAND_LEN * 2 + 1]).toBe(0)
    expect(frameDistance(a, b)).toBeLessThan(3.0)
  })
})

describe('dtwDistance', () => {
  it('is zero for a sequence against itself', () => {
    expect(dtwDistance(makeSequence(20), makeSequence(20))).toBeCloseTo(0, 6)
  })

  it('returns Infinity for an empty sequence', () => {
    expect(dtwDistance([], makeSequence(10))).toBe(Infinity)
  })

  it('is symmetric', () => {
    const a = makeSequence(18, 1)
    const b = makeSequence(25, 7)
    expect(dtwDistance(a, b)).toBeCloseTo(dtwDistance(b, a), 6)
  })

  it('stays near zero for the same gesture performed at a different speed', () => {
    // Same motion, same endpoints, sampled at 15 vs 40 frames.
    const slow = makeSequence(40, 3)
    const fast = makeSequence(15, 3)
    expect(dtwDistance(slow, fast)).toBeLessThan(0.02)
  })

  it('scores a different gesture much higher than a time-warped same gesture', () => {
    const reference = makeSequence(30, 3)
    const sameSlower = makeSequence(12, 3)
    const different = makeSequence(30, 42)
    expect(dtwDistance(reference, different)).toBeGreaterThan(
      dtwDistance(reference, sameSlower) * 5,
    )
  })

  it('separates gestures that differ only in direction of travel', () => {
    const up = makeSequence(30, 3, 0.3)
    const down = [...makeSequence(30, 3, 0.3)].reverse()
    expect(dtwDistance(up, down)).toBeGreaterThan(0.05)
  })
})

describe('resample', () => {
  it('produces exactly the requested length', () => {
    expect(resample(makeSequence(7), RESAMPLE_LEN)).toHaveLength(RESAMPLE_LEN)
    expect(resample(makeSequence(90), RESAMPLE_LEN)).toHaveLength(RESAMPLE_LEN)
  })

  it('preserves the first and last frame', () => {
    const seq = makeSequence(11)
    const out = resample(seq, RESAMPLE_LEN)
    expect(out[0][0]).toBeCloseTo(seq[0][0], 5)
    expect(out[RESAMPLE_LEN - 1][0]).toBeCloseTo(seq[seq.length - 1][0], 5)
  })

  it('snaps presence flags to 0 or 1 rather than blending them', () => {
    const mixed: Sequence = [
      frameToFeature(makeFrame(makeHand(), { handedness: 'Right' })),
      frameToFeature(makeFrame(makeHand(), { handedness: 'Left' })),
    ]
    for (const frame of resample(mixed, RESAMPLE_LEN)) {
      expect([0, 1]).toContain(frame[HAND_LEN * 2])
      expect([0, 1]).toContain(frame[HAND_LEN * 2 + 1])
    }
  })
})
