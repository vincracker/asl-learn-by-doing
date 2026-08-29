import { describe, expect, it } from 'vitest'
import { isHit } from './hitRule'
import { RUSH_COOLDOWN, RUSH_PASS } from '../content/rules'

const base = { settled: true, rolling: 0.9, pass: RUSH_PASS, now: 10_000, cooldownUntil: 0 }

describe('isHit', () => {
  it('clears the word on a settled, confident hold', () => {
    expect(isHit(base)).toBe(true)
  })

  it('refuses to score before the window has settled', () => {
    expect(isHit({ ...base, settled: false })).toBe(false)
  })

  it('refuses to score below the bar', () => {
    expect(isHit({ ...base, rolling: RUSH_PASS - 0.01 })).toBe(false)
  })

  it('scores exactly at the bar', () => {
    expect(isHit({ ...base, rolling: RUSH_PASS })).toBe(true)
  })

  it('will not let one continuous hold clear two words back to back', () => {
    const hitAt = 10_000
    const cooldownUntil = hitAt + RUSH_COOLDOWN
    // Still holding the same shape one frame later.
    expect(isHit({ ...base, now: hitAt + 16, cooldownUntil })).toBe(false)
    // And still blocked right up to the edge of the grace period.
    expect(isHit({ ...base, now: cooldownUntil - 1, cooldownUntil })).toBe(false)
    // Once the grace expires, a fresh hold scores again.
    expect(isHit({ ...base, now: cooldownUntil, cooldownUntil })).toBe(true)
  })

  it("honours a mode's own bar rather than a global one", () => {
    expect(isHit({ ...base, rolling: 0.8, pass: 0.85 })).toBe(false)
    expect(isHit({ ...base, rolling: 0.8, pass: 0.7 })).toBe(true)
  })
})
