import { describe, expect, it } from 'vitest'
import {
  SIXSEVEN_MAX_BEAT_MS,
  SIXSEVEN_MIN_BEAT_MS,
} from '../content/rules'
import { initialRep, readPose, stepRep, type Pose, type RepState } from './sixSeven'
import { HANDS, shiftHand } from './testUtils'

/**
 * A two-hand frame. `lift` is how far the screen-LEFT hand rides above the right one,
 * in the template hand's own units — the palm span is 0.3, so 0.24 is 0.8 palm-widths,
 * comfortably past the tilt threshold.
 */
function pair(lift: number, left = HANDS.openPalm(), right = HANDS.openPalm()) {
  return {
    landmarks: [
      shiftHand(left, -0.25, -lift / 2),
      shiftHand(right, 0.25, lift / 2),
    ],
  }
}

const UP = 0.24 // left hand high — past the threshold
const LEVEL = 0

describe('readPose', () => {
  it('accepts two flat palms held apart', () => {
    const pose = readPose(pair(UP))
    expect(pose.valid).toBe(true)
    expect(pose.fault).toBe('none')
    expect(pose.form).toBeCloseTo(1, 1)
  })

  it('signs the tilt by which hand is higher', () => {
    expect(readPose(pair(UP)).tilt).toBeGreaterThan(0)
    expect(readPose(pair(-UP)).tilt).toBeLessThan(0)
    expect(readPose(pair(LEVEL)).tilt).toBeCloseTo(0)
  })

  it('measures tilt in palm-widths, so distance from the camera cancels out', () => {
    const near = readPose(pair(UP)).tilt
    // Half-size hands, half the offset: the same gesture, further away.
    const small = HANDS.openPalm().map((p) => ({ x: 0.5 + (p.x - 0.5) / 2, y: 0.5 + (p.y - 0.5) / 2 }))
    const far = readPose({
      landmarks: [shiftHand(small, -0.125, -UP / 4), shiftHand(small, 0.125, UP / 4)],
    })
    expect(far.tilt).toBeCloseTo(near, 5)
  })

  it('rejects a single hand, however good the shape', () => {
    expect(readPose({ landmarks: [HANDS.openPalm()] }).fault).toBe('one-hand')
    expect(readPose({ landmarks: [] }).fault).toBe('no-hands')
    expect(readPose({}).fault).toBe('no-hands')
  })

  it('rejects a pair that is not flat — one closed hand is enough', () => {
    expect(readPose(pair(UP, HANDS.openPalm(), HANDS.fist())).fault).toBe('not-flat')
    expect(readPose(pair(UP, HANDS.victory(), HANDS.openPalm())).fault).toBe('not-flat')
  })

  it('rejects hands stacked in one column, where left and right stop being tellable apart', () => {
    const stacked = { landmarks: [shiftHand(HANDS.openPalm(), 0, -0.2), HANDS.openPalm()] }
    expect(readPose(stacked).fault).toBe('together')
  })
})

/** Replays frames through the counter at a fixed frame interval. */
function play(frames: Pose[], stepMs = 40, start: RepState = initialRep) {
  let s = start
  frames.forEach((pose, i) => {
    s = stepRep(s, pose, i * stepMs)
  })
  return s
}

/** `n` frames of the same pose — how a hand is held for a while. */
const hold = (lift: number, n: number) => Array.from({ length: n }, () => readPose(pair(lift)))

/** Alternating holds: `swaps` crossings, each one taking `n` frames. */
function swapping(swaps: number, n = 8) {
  return Array.from({ length: swaps + 1 }, (_, i) => hold(i % 2 ? -UP : UP, n)).flat()
}

describe('stepRep', () => {
  it('counts one 6-7 per two crossings, not per crossing', () => {
    // Arm, then swap four times: 6-7, 6-7.
    expect(play(swapping(4)).reps).toBe(2)
    expect(play(swapping(4)).beats).toBe(4)
  })

  it('does not score the first commit — you have to swap to count', () => {
    const armed = play(hold(UP, 30))
    expect(armed.reps).toBe(0)
    expect(armed.beats).toBe(0)
    expect(armed.pole).toBe(1)
  })

  it('does not score a half-finished 6-7', () => {
    expect(play(swapping(1)).reps).toBe(0)
    expect(play(swapping(3)).reps).toBe(1)
  })

  it('alternates the beat name, and every seven banks a rep', () => {
    expect(play(swapping(1)).beat).toBe('six')
    expect(play(swapping(2)).beat).toBe('seven')
    expect(play(swapping(2)).reps).toBe(1)
  })

  it('ignores wobble inside the deadband — holding still scores nothing', () => {
    const jitter = Array.from({ length: 60 }, (_, i) => readPose(pair(i % 2 ? 0.05 : -0.05)))
    expect(play([...hold(UP, 8), ...jitter]).reps).toBe(0)
  })

  it('will not count a hand that never crosses back', () => {
    expect(play([...hold(UP, 8), ...hold(-UP, 40)]).reps).toBe(0)
  })

  it('restarts the run when the rhythm is too slow to be the meme', () => {
    // The same three crossings either side of the limit: in rhythm it is a 6-7,
    // dragged out it is not.
    expect(crossAfter(SIXSEVEN_MAX_BEAT_MS - 200).reps).toBe(1)

    const slow = crossAfter(SIXSEVEN_MAX_BEAT_MS + 200)
    expect(slow.reps).toBe(0)
    expect(slow.halfBeats).toBe(0)
    expect(slow.pole).toBe(1) // the pole still follows the hands
  })

  it('restarts the run on a flail faster than a beat can be', () => {
    // Two crossings landing inside the minimum gap.
    let s = stepRep(initialRep, readPose(pair(UP)), 0)
    s = stepRep(s, readPose(pair(-UP)), 10)
    s = stepRep(s, readPose(pair(UP)), 10 + SIXSEVEN_MIN_BEAT_MS / 2)
    expect(s.reps).toBe(0)
    expect(s.halfBeats).toBe(0)
  })

  it('breaks the chain when the hands leave for longer than the bridge', () => {
    let s = play(swapping(1))
    expect(s.halfBeats).toBe(1)
    s = stepRep(s, { valid: false, form: 0, tilt: 0, fault: 'no-hands' }, 10_000)
    expect(s.pole).toBe(0)
    expect(s.halfBeats).toBe(0)
  })

  it('rides out a dropout short enough to be one lost frame', () => {
    const armed = play(hold(UP, 8))
    const blipped = stepRep(armed, { valid: false, form: 0, tilt: 0, fault: 'no-hands' }, 8 * 40 + 60)
    expect(blipped.pole).toBe(1)
    // ...and the swap on the far side of the blip still counts toward the run.
    expect(stepRep(blipped, readPose(pair(-UP)), 8 * 40 + 100).halfBeats).toBe(1)
  })

  it('keeps the tally when a chain breaks — only the run in progress is lost', () => {
    let s = play(swapping(4))
    expect(s.reps).toBe(2)
    s = stepRep(s, { valid: false, form: 0, tilt: 0, fault: 'one-hand' }, 20_000)
    expect(s.reps).toBe(2)
    expect(s.beats).toBe(4)
    expect(s.halfBeats).toBe(0)
  })

  it('remembers the longest unbroken run', () => {
    const s = play(swapping(5))
    expect(s.bestChain).toBe(5)
  })

  it('never mutates the state it was handed', () => {
    const before = play(swapping(2))
    const snapshot = { ...before }
    stepRep(before, readPose(pair(-UP)), 9_999)
    expect(before).toEqual(snapshot)
  })
})

/**
 * Arms the chain, lands one clean beat, then lands the second one `gap` ms later.
 * Only the last gap is under test — the first is deliberately in rhythm, so a
 * failure can only be the gap being measured.
 */
function crossAfter(gap: number): RepState {
  let s = stepRep(initialRep, readPose(pair(UP)), 0)
  s = stepRep(s, readPose(pair(-UP)), 300)
  return stepRep(s, readPose(pair(UP)), 300 + gap)
}
