import { describe, expect, it } from 'vitest'
import { emptyWindow, pushSample, type Window } from './rollingWindow'

/** Feeds a series of confidences at a fixed frame interval. */
function play(confs: number[], stepMs = 50, windowMs = 800) {
  let w: Window = emptyWindow
  let last = pushSample(w, 0, confs[0], windowMs)
  w = last.window
  confs.slice(1).forEach((c, i) => {
    last = pushSample(w, (i + 1) * stepMs, c, windowMs)
    w = last.window
  })
  return last
}

describe('pushSample', () => {
  it('averages the confidences inside the window', () => {
    // No zeros here, so the dropout bridge stays out of the way.
    expect(play([1, 0.5, 1, 0.5]).rolling).toBeCloseTo(0.75)
  })

  it('drops samples older than the window', () => {
    const stale = play(Array(40).fill(0), 50).window
    const fresh = pushSample(stale, 40 * 50 + 50, 1)
    expect(fresh.window.samples.length).toBeLessThanOrEqual(800 / 50 + 1)
  })

  it('does not report settled until most of a window has passed', () => {
    expect(play([1, 1], 50).settled).toBe(false)
    expect(play(Array(20).fill(1), 50).settled).toBe(true)
  })

  it('bridges a short dropout instead of recording a zero', () => {
    const held = pushSample(emptyWindow, 0, 0.9)
    const dropped = pushSample(held.window, 100, 0)
    expect(dropped.conf).toBeCloseTo(0.72) // 0.9 * 0.8
  })

  it('lets the confidence fall once the dropout outlasts the bridge', () => {
    const held = pushSample(emptyWindow, 0, 0.9)
    const dropped = pushSample(held.window, 400, 0)
    expect(dropped.conf).toBe(0)
  })

  it('rewards a steady hold over a single lucky frame', () => {
    const lucky = play([0, 0, 0, 1, 0, 0, 0], 50).rolling
    const steady = play([1, 1, 1, 1, 1, 1, 1], 50).rolling
    expect(steady).toBeGreaterThan(lucky)
    expect(lucky).toBeLessThan(0.5)
  })

  it('never mutates the window it was handed', () => {
    const before = pushSample(emptyWindow, 0, 0.5).window
    const count = before.samples.length
    pushSample(before, 50, 0.9)
    expect(before.samples.length).toBe(count)
  })
})
