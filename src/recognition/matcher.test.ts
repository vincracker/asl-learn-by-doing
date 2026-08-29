import { describe, it, expect } from 'vitest'
import { calibrate, matchTemplate, rankAll, scoreFor } from './matcher'
import { RESAMPLE_LEN, type Sequence } from './dtw'
import { frameToFeature } from './normalize'
import { makeHand, makeFrame, translate } from './testUtils'

/** A gesture: hand `seed` drifting by `drift`, with optional per-frame jitter. */
function gesture(seed: number, n = 24, drift = 0.3, jitter = 0): Sequence {
  const hand = makeHand(seed)
  return Array.from({ length: n }, (_, i) => {
    const t = i / (n - 1)
    return frameToFeature(makeFrame(translate(hand, jitter * Math.sin(i), -drift * t)))
  })
}

describe('calibrate', () => {
  it('produces a RESAMPLE_LEN template', () => {
    const t = calibrate('bus', 'BUS', [gesture(1), gesture(1, 30), gesture(1, 18)])
    expect(t.frames).toHaveLength(RESAMPLE_LEN)
    expect(t.id).toBe('bus')
  })

  it('reports high self-agreement for consistent takes', () => {
    const t = calibrate('bus', 'BUS', [gesture(1, 24), gesture(1, 28), gesture(1, 20)])
    expect(t.selfAgreement).toBeGreaterThan(0.5)
  })

  it('widens the pass threshold when takes are inconsistent', () => {
    const tight = calibrate('a', 'A', [gesture(1, 24), gesture(1, 26), gesture(1, 22)])
    const loose = calibrate('b', 'B', [gesture(1, 24, 0.3), gesture(1, 24, 0.1), gesture(1, 24, 0.5)])
    expect(loose.passDistance).toBeGreaterThan(tight.passDistance)
  })

  it('throws rather than silently emitting a useless template', () => {
    expect(() => calibrate('x', 'X', [])).toThrow(/no takes/)
  })
})

describe('matchTemplate', () => {
  const template = calibrate('bus', 'BUS', [gesture(1, 24), gesture(1, 28), gesture(1, 20)])

  it('passes an attempt that repeats the authored gesture', () => {
    const result = matchTemplate(gesture(1, 26), template)
    expect(result.passed).toBe(true)
    expect(result.score).toBeGreaterThan(0.5)
  })

  it('passes the same gesture performed at a different speed', () => {
    expect(matchTemplate(gesture(1, 45), template).passed).toBe(true)
    expect(matchTemplate(gesture(1, 12), template).passed).toBe(true)
  })

  it('rejects a different gesture', () => {
    const result = matchTemplate(gesture(77, 24), template)
    expect(result.passed).toBe(false)
    expect(result.score).toBeLessThan(0.2)
  })

  it('rejects the authored gesture performed backwards', () => {
    expect(matchTemplate([...gesture(1, 24)].reverse(), template).passed).toBe(false)
  })
})

describe('rankAll', () => {
  const templates = [
    calibrate('bus', 'BUS', [gesture(1, 24), gesture(1, 27)]),
    calibrate('stop', 'STOP', [gesture(50, 24), gesture(50, 27)]),
    calibrate('help', 'HELP', [gesture(77, 24), gesture(77, 27)]),
  ]

  it('ranks the true sign first', () => {
    expect(rankAll(gesture(50, 25), templates)[0].id).toBe('stop')
  })

  it('returns every template, sorted by distance', () => {
    const ranked = rankAll(gesture(1, 25), templates)
    expect(ranked).toHaveLength(3)
    const distances = ranked.map((r) => r.distance)
    expect([...distances].sort((a, b) => a - b)).toEqual(distances)
  })
})

describe('scoreFor', () => {
  it('is 1 at zero distance and decreases monotonically', () => {
    expect(scoreFor(0, 0.1)).toBe(1)
    expect(scoreFor(0.1, 0.1)).toBeLessThan(1)
    expect(scoreFor(0.5, 0.1)).toBeLessThan(scoreFor(0.2, 0.1))
  })
})
