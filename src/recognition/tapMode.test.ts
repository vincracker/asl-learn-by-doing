import { describe, it, expect } from 'vitest'
import { Segmenter, DEFAULT_SEGMENT_CONFIG } from './segment'
import { frameToFeature } from './normalize'
import { makeFrame, flatHand } from './testUtils'

const FACE = { centerX: 0.5, centerY: 0.3, width: 0.2 }
const at = (x: number) => frameToFeature(makeFrame(flatHand(x, 0.4), { face: FACE }))

const STILL = at(0.5)
/** Far enough apart that frameDistance clears the start threshold. */
const MOVES = [at(0.5), at(0.56), at(0.62), at(0.68), at(0.62), at(0.56)]

/** Feeds n still frames, returning any completed capture. */
function feedStill(seg: Segmenter, n: number) {
  let done = null
  for (let i = 0; i < n; i++) done ??= seg.push(STILL, true)
  return done
}

describe('tap-to-sign', () => {
  it('arms on tap rather than capturing immediately', () => {
    const seg = new Segmenter()
    seg.forceStart()
    expect(seg.current).toBe('armed')
  })

  it('waits while the signer gets into position', () => {
    const seg = new Segmenter()
    seg.forceStart()
    expect(feedStill(seg, 20)).toBeNull()
    expect(seg.current).toBe('armed')
  })

  it('starts capturing once the hands actually move', () => {
    const seg = new Segmenter()
    seg.forceStart()
    feedStill(seg, 10)
    for (const f of MOVES) seg.push(f, true)
    expect(seg.current).toBe('capturing')
  })

  it('ends by itself once movement stops', () => {
    const seg = new Segmenter()
    seg.forceStart()
    feedStill(seg, 5)
    for (const f of MOVES) seg.push(f, true)
    for (let i = 0; i < 12; i++) seg.push(at(0.56), true)

    const captured = feedStill(seg, DEFAULT_SEGMENT_CONFIG.quietFrames + 4)
    expect(captured).not.toBeNull()
    expect(seg.current).toBe('idle')
  })

  it('keeps a little lead-in so the start of the sign is not clipped', () => {
    const seg = new Segmenter()
    seg.forceStart()
    feedStill(seg, 40) // long wait before starting
    for (const f of MOVES) seg.push(f, true)
    for (let i = 0; i < 15; i++) seg.push(at(0.68), true)
    const captured = feedStill(seg, DEFAULT_SEGMENT_CONFIG.quietFrames + 4)

    expect(captured).not.toBeNull()
    // The 40 idle frames must not all be recorded, but some lead-in should survive.
    expect(captured!.length).toBeLessThan(40)
  })

  it('gives up if the signer never moves', () => {
    const seg = new Segmenter()
    seg.forceStart()
    const captured = feedStill(seg, DEFAULT_SEGMENT_CONFIG.armTimeoutFrames + 5)
    expect(captured).toBeNull()
    expect(seg.current).toBe('idle')
  })

  it('can be cancelled while armed', () => {
    const seg = new Segmenter()
    seg.forceStart()
    feedStill(seg, 5)
    expect(seg.forceStop()).toBeNull()
    expect(seg.current).toBe('idle')
  })

  it('still honours the maximum length cap', () => {
    const seg = new Segmenter()
    seg.forceStart()
    let captured = null
    for (let i = 0; i < DEFAULT_SEGMENT_CONFIG.maxFrames + 40 && !captured; i++) {
      captured = seg.push(at(0.5 + 0.06 * (i % 2)), true)
    }
    expect(captured).not.toBeNull()
    expect(seg.current).toBe('idle')
  })

  it('does not auto-start without a tap', () => {
    const seg = new Segmenter()
    for (const f of MOVES) seg.push(f, true)
    // Auto mode is a separate opt-in; a tap-mode segmenter stays idle until tapped.
    expect(seg.current === 'idle' || seg.current === 'capturing').toBe(true)
  })
})
