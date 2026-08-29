import { describe, it, expect } from 'vitest'
import { calibrate, applyConfusabilityCaps, type SignTemplate } from './matcher'
import type { Sequence } from './dtw'
import { frameToFeature } from './normalize'
import { makeFrame, flatHand } from './testUtils'

const FACE = { centerX: 0.5, centerY: 0.3, width: 0.2 }
const at = (x: number, y: number) => frameToFeature(makeFrame(flatHand(x, y), { face: FACE }))

/** HELLO — temple, salutes outward. */
const hello = (n: number, j = 0): Sequence =>
  Array.from({ length: n }, (_, i) => at(0.60 + 0.14 * (i / (n - 1)) + j, 0.24))
/** FORGET — forehead, wipes across. Deliberately close to HELLO. */
const forget = (n: number, j = 0): Sequence =>
  Array.from({ length: n }, (_, i) => at(0.58 - 0.10 * (i / (n - 1)) + j, 0.22))
/** THANK YOU — chin, forward and down. Clearly distinct. */
const thanks = (n: number, j = 0): Sequence =>
  Array.from({ length: n }, (_, i) => at(0.50 + 0.03 * (i / (n - 1)) + j, 0.40 + 0.14 * (i / (n - 1))))

const takesFor = (fn: (n: number, j: number) => Sequence) =>
  [fn(24, 0), fn(30, 0.05), fn(19, -0.04)]

const byId = (ts: SignTemplate[]) => new Map(ts.map((t) => [t.id, t]))

describe('applyConfusabilityCaps', () => {
  // Calibrated in isolation, as if each were the first sign ever recorded.
  const solo = () => [
    calibrate('hello', 'HELLO', takesFor(hello)),
    calibrate('forget', 'FORGET', takesFor(forget)),
    calibrate('thank-you', 'THANK YOU', takesFor(thanks)),
  ]

  it('gives the same result regardless of recording order', () => {
    const forward = byId(applyConfusabilityCaps(solo()))
    const reversed = byId(applyConfusabilityCaps([...solo()].reverse()))

    for (const id of ['hello', 'forget', 'thank-you']) {
      expect(reversed.get(id)!.passDistance).toBeCloseTo(forward.get(id)!.passDistance, 9)
      expect(reversed.get(id)!.nearestOther?.id).toBe(forward.get(id)!.nearestOther?.id)
    }
  })

  it('caps the sign recorded first, not just later ones', () => {
    const before = byId(solo())
    const after = byId(applyConfusabilityCaps(solo()))
    // HELLO has a close rival in FORGET, so its gate must narrow even though nothing
    // existed when it was recorded.
    expect(after.get('hello')!.passDistance).toBeLessThan(before.get('hello')!.passDistance)
  })

  it('identifies each sign’s nearest rival symmetrically for a close pair', () => {
    const capped = byId(applyConfusabilityCaps(solo()))
    expect(capped.get('hello')!.nearestOther?.id).toBe('forget')
    expect(capped.get('forget')!.nearestOther?.id).toBe('hello')
  })

  it('never widens a threshold that was already tight', () => {
    const before = byId(solo())
    const after = byId(applyConfusabilityCaps(solo()))
    for (const [id, t] of after) {
      expect(t.passDistance).toBeLessThanOrEqual(before.get(id)!.passDistance + 1e-9)
    }
  })

  it('handles zero and one template without fuss', () => {
    expect(applyConfusabilityCaps([])).toEqual([])
    const one = calibrate('hello', 'HELLO', takesFor(hello))
    const [capped] = applyConfusabilityCaps([one])
    expect(capped.passDistance).toBe(one.passDistance)
    expect(capped.nearestOther).toBeUndefined()
  })
})
