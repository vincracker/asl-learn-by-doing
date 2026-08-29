import {
  DROPOUT_BRIDGE_MS,
  SIXSEVEN_MAX_BEAT_MS,
  SIXSEVEN_MIN_BEAT_MS,
  SIXSEVEN_OPEN,
  SIXSEVEN_SPREAD,
  SIXSEVEN_TILT,
} from '../content/rules'
import { handGeom, type Landmark } from './geometry'
import type { RecognizerResult } from './scoreFrame'

/**
 * The 6-7 meme, scored strictly.
 *
 * Every other mode in this app asks "is your hand in this shape", which one frame can
 * answer. 6-7 is a *motion*: two flat palms held apart, one riding up as the other drops,
 * then swapping back. A single frame can never contain it, so this module splits the job
 * in two — `readPose` judges one frame, `stepRep` accumulates frames into beats.
 *
 * Both halves are pure and copy-on-write, so a whole round can be replayed frame by frame
 * in a test with no camera, no DOM and no timers.
 */

/** Why a frame didn't count, phrased so the screen can coach off it directly. */
export type Fault = 'none' | 'no-hands' | 'one-hand' | 'not-flat' | 'together'

export type Pose = {
  /** True when the frame is a legal 6-7 pose: two hands, both flat, held apart. */
  valid: boolean
  /** 0..1, how flat the weaker of the two palms is. Drives the form meter. */
  form: number
  /**
   * Signed vertical offset between the palms, in palm-widths. Positive when the
   * screen-left hand rides higher than the screen-right one.
   */
  tilt: number
  fault: Fault
}

export const NO_POSE: Pose = { valid: false, form: 0, tilt: 0, fault: 'no-hands' }

/** Palm centre: the wrist and the four knuckles. Steadier than the wrist alone, which swings. */
function palm(lm: Landmark[]): { x: number; y: number } {
  const pts = [0, 5, 9, 13, 17]
  let x = 0
  let y = 0
  for (const i of pts) {
    x += lm[i].x
    y += lm[i].y
  }
  return { x: x / pts.length, y: y / pts.length }
}

/**
 * How flat the hand is: the least-extended of the four fingers.
 *
 * The thumb is deliberately ignored. `geomScore(_, 'Open_Palm')` halves its score for a
 * tucked thumb, but a 6-7 palm is judged on the flat of the hand and where the thumb
 * happens to sit is noise — penalising it would fail correct poses.
 */
function flatness(lm: Landmark[]): number {
  return Math.min(...handGeom(lm).ext)
}

const miss = (fault: Fault, tilt = 0): Pose => ({ valid: false, form: 0, tilt, fault })

/** Judges one frame of landmarks against the 6-7 pose. */
export function readPose(res: RecognizerResult): Pose {
  const hands = res.landmarks ?? []
  // The recognizer is capped at two hands, so anything that isn't a pair is a hand short.
  if (hands.length !== 2) return miss(hands.length === 0 ? 'no-hands' : 'one-hand')

  // Ordered by screen x, not by the model's handedness: sorting needs no extra model
  // output, and the mirrored preview flips both hands together so the pair still reads
  // the same way round.
  const [pa, pb] = hands.map(palm).sort((p, q) => p.x - q.x)
  const scale =
    hands.reduce((sum, lm) => sum + Math.hypot(lm[0].x - lm[9].x, lm[0].y - lm[9].y), 0) / 2
  if (scale < 1e-6) return miss('no-hands')

  // y grows downward, so a positive gap means the right palm sits lower — left hand up.
  const tilt = (pb.y - pa.y) / scale

  const form = Math.min(...hands.map(flatness))
  if (form < SIXSEVEN_OPEN) return miss('not-flat', tilt)
  if ((pb.x - pa.x) / scale < SIXSEVEN_SPREAD) return miss('together', tilt)

  return { valid: true, form, tilt, fault: 'none' }
}

/** The two halves of one 6-7: the hands cross one way, then the other. */
export type Beat = 'six' | 'seven'

export type RepState = {
  /** Which side the pair is committed to: -1, +1, or 0 before the first commit. */
  readonly pole: -1 | 0 | 1
  /** Crossings since the chain last started. Two of them make one 6-7. */
  readonly halfBeats: number
  /** Completed 6-7s. This is the score. */
  readonly reps: number
  /** The beat just called. */
  readonly beat: Beat | null
  /** Every beat ever called this round — monotonic, so the UI can flash off it. */
  readonly beats: number
  readonly lastCrossAt: number
  readonly lastValidAt: number
  /** Longest unbroken run of beats this round. */
  readonly bestChain: number
}

export const initialRep: RepState = {
  pole: 0,
  halfBeats: 0,
  reps: 0,
  beat: null,
  beats: 0,
  lastCrossAt: 0,
  lastValidAt: -Infinity,
  bestChain: 0,
}

/** Chain broken, but the tally and the pulse survive — only the run in progress is lost. */
const breakChain = (s: RepState): RepState =>
  s.pole === 0 && s.halfBeats === 0 ? s : { ...s, pole: 0, halfBeats: 0, beat: null }

/**
 * Folds one frame into the running count.
 *
 * A beat is a *crossing*: the pair was committed to one side and is now committed to the
 * other. The first commit of a chain only arms it — you have to swap to score — and the
 * pair keeps its side anywhere inside the deadband, so nothing but a real move counts.
 */
export function stepRep(s: RepState, pose: Pose, now: number): RepState {
  if (!pose.valid) {
    // Same dropout bridge the shape modes use: one lost frame mid-swap is invisible,
    // but half a 6-7 done off-camera is not a 6-7.
    if (now - s.lastValidAt <= DROPOUT_BRIDGE_MS) return s
    return breakChain(s)
  }

  const side = pose.tilt >= SIXSEVEN_TILT ? 1 : pose.tilt <= -SIXSEVEN_TILT ? -1 : s.pole
  const base = { ...s, lastValidAt: now }

  // Still on the same side, or drifting through the deadband: nothing has happened.
  if (side === s.pole) return base

  // First commit arms the chain without scoring it.
  if (s.pole === 0) return { ...base, pole: side, lastCrossAt: now }

  const gap = now - s.lastCrossAt
  if (gap < SIXSEVEN_MIN_BEAT_MS || gap > SIXSEVEN_MAX_BEAT_MS) {
    // Out of rhythm. The hands really are on the new side, so the pole has to follow —
    // but the run restarts from here rather than banking the swap.
    return { ...base, pole: side, halfBeats: 0, beat: null, lastCrossAt: now }
  }

  const halfBeats = s.halfBeats + 1
  const isSeven = halfBeats % 2 === 0
  return {
    ...base,
    pole: side,
    halfBeats,
    reps: isSeven ? s.reps + 1 : s.reps,
    beat: isSeven ? 'seven' : 'six',
    beats: s.beats + 1,
    lastCrossAt: now,
    bestChain: Math.max(s.bestChain, halfBeats),
  }
}
