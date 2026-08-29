import { describe, expect, it } from 'vitest'
import { clamp01, geomScore, handGeom } from './geometry'
import { HANDS, makeHand } from './testUtils'
import { GESTURE_IDS, type GestureId } from '../content/gestures'

describe('clamp01', () => {
  it('bounds values to the unit interval', () => {
    expect(clamp01(-3)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(9)).toBe(1)
  })
})

describe('handGeom', () => {
  it('reads an open palm as four extended fingers', () => {
    const g = handGeom(HANDS.openPalm())
    g.ext.forEach((e) => expect(e).toBeGreaterThan(0.5))
    expect(g.closed).toBeLessThan(0.5)
  })

  it('reads a fist as closed', () => {
    const g = handGeom(HANDS.fist())
    g.ext.forEach((e) => expect(e).toBeLessThan(0.2))
    expect(g.closed).toBeGreaterThan(0.8)
  })

  it('separates a thumb held clear of the palm from one tucked in', () => {
    const out = handGeom(HANDS.thumbUp())
    const tucked = handGeom(HANDS.fist())
    expect(out.thumbOut).toBeGreaterThan(tucked.thumbOut)
  })

  it('is rotation-invariant: a tilted open palm still reads as extended', () => {
    const upright = HANDS.openPalm()
    const rotate = (deg: number) => {
      const a = (deg * Math.PI) / 180
      return upright.map((p) => ({
        x: 0.5 + (p.x - 0.5) * Math.cos(a) - (p.y - 0.7) * Math.sin(a),
        y: 0.7 + (p.x - 0.5) * Math.sin(a) + (p.y - 0.7) * Math.cos(a),
      }))
    }
    const tilted = handGeom(rotate(40))
    tilted.ext.forEach((e) => expect(e).toBeGreaterThan(0.5))
  })
})

describe('geomScore', () => {
  const CASES: [GestureId, () => ReturnType<typeof HANDS.fist>][] = [
    ['Open_Palm', HANDS.openPalm],
    ['Closed_Fist', HANDS.fist],
    ['Thumb_Up', HANDS.thumbUp],
    ['Victory', HANDS.victory],
    ['Pointing_Up', HANDS.pointingUp],
    ['ILoveYou', HANDS.iLoveYou],
  ]

  it.each(CASES)('scores a matching hand highest for %s', (gesture, hand) => {
    const lm = hand()
    const mine = geomScore(lm, gesture)
    expect(mine).toBeGreaterThan(0.5)

    const others = GESTURE_IDS.filter((g) => g !== gesture).map((g) => geomScore(lm, g))
    expect(mine).toBeGreaterThan(Math.max(...others))
  })

  it('tells a thumbs-up apart from a plain fist, which the canned classifier confuses', () => {
    expect(geomScore(HANDS.thumbUp(), 'Thumb_Up')).toBeGreaterThan(
      geomScore(HANDS.fist(), 'Thumb_Up'),
    )
    expect(geomScore(HANDS.fist(), 'Closed_Fist')).toBeGreaterThan(
      geomScore(HANDS.thumbUp(), 'Closed_Fist'),
    )
  })

  it('still credits a tilted thumbs-up rather than zeroing it', () => {
    const flat = makeHand({ fingers: [false, false, false, false], thumbOut: true, thumbUp: false })
    const score = geomScore(flat, 'Thumb_Up')
    expect(score).toBeGreaterThan(0.4)
    expect(score).toBeLessThan(geomScore(HANDS.thumbUp(), 'Thumb_Up'))
  })

  it('returns 0 for an unknown gesture id', () => {
    expect(geomScore(HANDS.fist(), 'Nope' as GestureId)).toBe(0)
  })
})
