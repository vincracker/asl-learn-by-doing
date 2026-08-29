import { describe, it, expect } from 'vitest'
import { calibrate, rankAll, matchTemplate } from './matcher'
import type { Sequence } from './dtw'
import { frameToFeature } from './normalize'
import { makeFrame, flatHand } from './testUtils'

/**
 * HELLO vs THANK-YOU is the hardest discrimination in the starter vocabulary: both are
 * one-handed flat-B hands that start near the face and move outward. Their handshapes are
 * nearly identical, so essentially all of the signal lives in the face-relative location
 * component — HELLO starts at the temple, THANK-YOU at the chin.
 *
 * If these tests fail, the location feature is not pulling its weight and no amount of
 * careful recording will separate the two signs.
 */

const FACE = { centerX: 0.5, centerY: 0.3, width: 0.2 }

/** HELLO: flat hand at the temple, salutes outward and away from the head. */
function hello(n = 24, jitter = 0): Sequence {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    return frameToFeature(
      makeFrame(flatHand(0.60 + 0.14 * t + jitter, 0.24 + 0.02 * t), { face: FACE }),
    )
  })
}

/** THANK-YOU: flat hand at the chin, moves forward and down toward the listener. */
function thankYou(n = 24, jitter = 0): Sequence {
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    return frameToFeature(
      makeFrame(flatHand(0.50 + 0.03 * t + jitter, 0.40 + 0.14 * t), { face: FACE }),
    )
  })
}

describe('HELLO vs THANK-YOU', () => {
  const helloTemplate = calibrate('hello', 'HELLO', [
    hello(24), hello(28, 0.004), hello(21, -0.004),
  ])
  const thanksTemplate = calibrate('thank-you', 'THANK-YOU', [
    thankYou(24), thankYou(28, 0.004), thankYou(21, -0.004),
  ])
  const templates = [helloTemplate, thanksTemplate]

  it('confirms the two signs really do share a handshape', () => {
    // Sanity check on the premise: with the location block zeroed out (no face), the
    // two signs should look very similar indeed.
    const h = frameToFeature(makeFrame(flatHand(0.6, 0.24), { face: null }))
    const t = frameToFeature(makeFrame(flatHand(0.5, 0.4), { face: null }))
    const shapeDiff = h.slice(0, 63).reduce((m, v, i) => Math.max(m, Math.abs(v - t[i])), 0)
    expect(shapeDiff).toBeLessThan(1e-5)
  })

  it('recognises HELLO as HELLO', () => {
    const ranked = rankAll(hello(26), templates)
    expect(ranked[0].id).toBe('hello')
    expect(matchTemplate(hello(26), helloTemplate).passed).toBe(true)
  })

  it('recognises THANK-YOU as THANK-YOU', () => {
    const ranked = rankAll(thankYou(26), templates)
    expect(ranked[0].id).toBe('thank-you')
    expect(matchTemplate(thankYou(26), thanksTemplate).passed).toBe(true)
  })

  it('does not confuse HELLO for THANK-YOU', () => {
    expect(matchTemplate(hello(26), thanksTemplate).passed).toBe(false)
    expect(matchTemplate(thankYou(26), helloTemplate).passed).toBe(false)
  })

  it('separates them by a workable margin, not a hair', () => {
    const correct = matchTemplate(hello(26), helloTemplate).distance
    const wrong = matchTemplate(hello(26), thanksTemplate).distance
    expect(wrong).toBeGreaterThan(correct * 3)
  })
})
