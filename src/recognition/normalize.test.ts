import { describe, it, expect } from 'vitest'
import { frameToFeature, handShape, mirrorFeature, HAND_LEN, SHAPE_LEN } from './normalize'
import { makeHand, makeFrame, translate, scalePts, rotateZ } from './testUtils'

const maxAbsDiff = (a: Float32Array, b: Float32Array) =>
  a.reduce((max, v, i) => Math.max(max, Math.abs(v - b[i])), 0)

describe('handShape invariance', () => {
  const hand = makeHand()
  const base = handShape(hand)

  it('is unchanged by translation', () => {
    expect(maxAbsDiff(base, handShape(translate(hand, 0.15, -0.2, 0.03)))).toBeLessThan(1e-5)
  })

  it('is unchanged by uniform scaling', () => {
    expect(maxAbsDiff(base, handShape(scalePts(hand, 2.5)))).toBeLessThan(1e-5)
  })

  it('is unchanged by rotation', () => {
    expect(maxAbsDiff(base, handShape(rotateZ(hand, Math.PI / 3)))).toBeLessThan(1e-5)
  })

  it('does change for a genuinely different hand pose', () => {
    expect(maxAbsDiff(base, handShape(makeHand(99)))).toBeGreaterThan(0.05)
  })
})

describe('location component', () => {
  const hand = makeHand()

  it('changes when the hand moves relative to a fixed face', () => {
    const low = frameToFeature(makeFrame(hand))
    const high = frameToFeature(makeFrame(translate(hand, 0, -0.25)))
    const locIdx = SHAPE_LEN + 1 // y of the right hand's location block
    expect(Math.abs(low[locIdx] - high[locIdx])).toBeGreaterThan(0.5)
  })

  it('is measured in face-widths, so it survives the user moving closer', () => {
    const near = frameToFeature(makeFrame(hand, { face: { centerX: 0.5, centerY: 0.3, width: 0.2 } }))
    // Same geometry scaled about the face center: hand and face grow together.
    const scaledHand = hand.map((p) => ({
      x: 0.5 + (p.x - 0.5) * 2, y: 0.3 + (p.y - 0.3) * 2, z: p.z * 2,
    }))
    const far = frameToFeature(makeFrame(scaledHand, { face: { centerX: 0.5, centerY: 0.3, width: 0.4 } }))
    expect(Math.abs(near[SHAPE_LEN] - far[SHAPE_LEN])).toBeLessThan(1e-5)
    expect(Math.abs(near[SHAPE_LEN + 1] - far[SHAPE_LEN + 1])).toBeLessThan(1e-5)
  })

  it('falls back to zeros when no face is detected', () => {
    const f = frameToFeature(makeFrame(hand, { face: null }))
    expect(f[SHAPE_LEN]).toBe(0)
    expect(f[SHAPE_LEN + 1]).toBe(0)
  })
})

describe('presence flags', () => {
  it('flags only the hand that was seen', () => {
    const right = frameToFeature(makeFrame(makeHand(), { handedness: 'Right' }))
    expect(right[HAND_LEN * 2]).toBe(1)
    expect(right[HAND_LEN * 2 + 1]).toBe(0)
  })
})

describe('mirrorFeature', () => {
  it('swaps handedness and is its own inverse', () => {
    const original = frameToFeature(makeFrame(makeHand(), { handedness: 'Right' }))
    const mirrored = mirrorFeature(original)

    expect(mirrored[HAND_LEN * 2]).toBe(0)
    expect(mirrored[HAND_LEN * 2 + 1]).toBe(1)
    expect(maxAbsDiff(original, mirrorFeature(mirrored))).toBeLessThan(1e-6)
  })
})
