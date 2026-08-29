import { describe, it, expect } from 'vitest'
import { calibrate, matchTemplate, PASS_DISTANCE_MAX } from './matcher'
import type { Sequence } from './dtw'
import { frameToFeature } from './normalize'
import { makeFrame, flatHand } from './testUtils'

const FACE = { centerX: 0.5, centerY: 0.3, width: 0.2 }
const at = (x: number, y: number) => frameToFeature(makeFrame(flatHand(x, y), { face: FACE }))

const hello = (n: number, j = 0): Sequence =>
  Array.from({ length: n }, (_, i) => at(0.60 + 0.14 * (i / (n - 1)) + j, 0.24))
const thankYou = (n: number, j = 0): Sequence =>
  Array.from({ length: n }, (_, i) => at(0.50 + 0.03 * (i / (n - 1)) + j, 0.40 + 0.14 * (i / (n - 1))))

/** Deliberately inconsistent takes, like a hurried authoring session. */
const sloppy = (fn: (n: number, j: number) => Sequence) =>
  [fn(24, 0), fn(30, 0.18), fn(18, -0.21), fn(26, 0.15)]

/** A rival sign performed close to HELLO — the case where thresholds must tighten. */
const nearlyHello = (n: number, j = 0): Sequence =>
  Array.from({ length: n }, (_, i) => at(0.62 + 0.14 * (i / (n - 1)) + j, 0.29))

describe('pass threshold safety', () => {
  it('never exceeds the absolute ceiling, however sloppy the takes', () => {
    const t = calibrate('hello', 'HELLO', sloppy(hello))
    expect(t.passDistance).toBeLessThanOrEqual(PASS_DISTANCE_MAX)
  })

  it('tightens the threshold when a confusable sign already exists', () => {
    const rival = calibrate('rival', 'RIVAL', [nearlyHello(24), nearlyHello(27, 0.004)])
    const takes = [hello(24), hello(30, 0.05), hello(18, -0.04)]
    const alone = calibrate('hello', 'HELLO', takes)
    const aware = calibrate('hello', 'HELLO', takes, [rival])
    expect(aware.passDistance).toBeLessThan(alone.passDistance)
  })

  it('does not accept a different sign even after a sloppy recording', () => {
    const thanks = calibrate('thank-you', 'THANK-YOU', [thankYou(24), thankYou(28, 0.004)])
    // Without the caps this template's gate was wide enough to admit THANK-YOU.
    const helloT = calibrate('hello', 'HELLO', sloppy(hello), [thanks])
    expect(matchTemplate(thankYou(26), helloT).passed).toBe(false)
  })

  it('still accepts a genuine repeat of the authored sign', () => {
    const thanks = calibrate('thank-you', 'THANK-YOU', [thankYou(24), thankYou(28, 0.004)])
    const helloT = calibrate('hello', 'HELLO', [hello(24), hello(27, 0.004), hello(21, -0.004)], [thanks])
    expect(matchTemplate(hello(25), helloT).passed).toBe(true)
  })

  it('reports confusability so the author tool can warn', () => {
    const thanks = calibrate('thank-you', 'THANK-YOU', [thankYou(24), thankYou(28, 0.004)])
    const t = calibrate('hello', 'HELLO', [hello(24), hello(27, 0.004)], [thanks])
    expect(t.nearestOther?.id).toBe('thank-you')
    expect(t.nearestOther?.distance).toBeGreaterThan(0)
  })
})
