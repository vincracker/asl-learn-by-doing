import type { Sequence } from './dtw'
import { frameDistance } from './dtw'

/**
 * `armed` is the tap-to-sign waiting state: the user has tapped but has not started
 * moving yet, so we are holding a short pre-roll and watching for the sign to begin.
 */
export type SegmentState = 'idle' | 'armed' | 'capturing'

export type SegmentConfig = {
  /** Motion above this starts a capture. */
  startThreshold: number
  /** Motion below this for `quietFrames` ends it. */
  stopThreshold: number
  quietFrames: number
  minFrames: number
  maxFrames: number
  /** After a tap, give up if the signer never starts moving within this many frames. */
  armTimeoutFrames: number
  /** Frames of lead-in kept from before movement began, so the sign is not clipped. */
  prerollFrames: number
}

export const DEFAULT_SEGMENT_CONFIG: SegmentConfig = {
  startThreshold: 0.08,
  stopThreshold: 0.04,
  quietFrames: 8,
  minFrames: 8,
  maxFrames: 75, // ~2.5s at 30fps
  armTimeoutFrames: 90, // ~3s to get into position
  prerollFrames: 5,
}

/** Motion below this fraction of the take's peak counts as "not signing yet". */
const TRIM_THRESHOLD_RATIO = 0.18
/** Frames of margin kept either side of the detected sign, so nothing is clipped. */
const TRIM_PADDING = 3
/** Shorter than this and there is nothing meaningful to trim. */
const TRIM_MIN_LENGTH = 6

/**
 * Cuts the dead motion off both ends of a captured take.
 *
 * A capture almost always contains more than the sign: the hand rising into position
 * beforehand and dropping away afterwards, plus however long the user held the button.
 * That incidental motion differs on every take, so leaving it in wrecks both template
 * consistency and match scores — DTW ends up aligning the approach rather than the sign.
 *
 * Endpoints are found relative to the take's own peak motion, so this works whether the
 * sign was performed briskly or slowly. If no clear span stands out (a held, static
 * handshape) the take is returned untouched rather than mangled.
 */
export function trimToMotion(sequence: Sequence): Sequence {
  if (sequence.length < TRIM_MIN_LENGTH) return sequence

  // Motion energy per frame, smoothed so a single jittery frame can't set the endpoints.
  const raw = sequence.map((f, i) => (i === 0 ? 0 : frameDistance(sequence[i - 1], f)))
  const motion = raw.map((_, i) => {
    const lo = Math.max(0, i - 1)
    const hi = Math.min(raw.length - 1, i + 1)
    let sum = 0
    for (let j = lo; j <= hi; j++) sum += raw[j]
    return sum / (hi - lo + 1)
  })

  const peak = Math.max(...motion)
  if (peak <= 0) return sequence

  const threshold = peak * TRIM_THRESHOLD_RATIO
  const first = motion.findIndex((m) => m >= threshold)
  if (first === -1) return sequence

  let last = motion.length - 1
  while (last > first && motion[last] < threshold) last--

  const start = Math.max(0, first - TRIM_PADDING)
  const end = Math.min(sequence.length, last + TRIM_PADDING + 1)
  const trimmed = sequence.slice(start, end)

  // A trim that leaves almost nothing means the heuristic misread the take; keep the
  // original rather than handing back something unscoreable.
  return trimmed.length >= TRIM_MIN_LENGTH ? trimmed : sequence
}

/**
 * Decides when a sign attempt begins and ends.
 *
 * Two ways in. Auto mode watches for motion and is convenient but not trustworthy — a
 * busy background or someone walking past will trigger it. Tap mode (`forceStart`) is the
 * dependable path: the signer taps once, gets into position at their own pace, and the
 * capture then begins on their first real movement and ends when they stop. Either way
 * the end is detected the same way, so a take never depends on the user timing a release.
 */
export class Segmenter {
  private state: SegmentState = 'idle'
  private buffer: Sequence = []
  private prev: Float32Array | null = null
  private quiet = 0
  private armed = 0
  private manual = false
  private readonly config: SegmentConfig

  constructor(config: SegmentConfig = DEFAULT_SEGMENT_CONFIG) {
    this.config = config
  }

  get current(): SegmentState {
    return this.state
  }

  get length(): number {
    return this.buffer.length
  }

  /**
   * Feeds one frame. Returns the captured sequence on the frame where the attempt
   * completes, otherwise null.
   */
  push(feature: Float32Array, hasHands: boolean): Sequence | null {
    const motion = this.prev ? frameDistance(this.prev, feature) : 0
    this.prev = feature

    if (this.state === 'idle') {
      if (this.manual || !hasHands || motion <= this.config.startThreshold) return null
      this.begin()
    }

    if (this.state === 'armed') return this.waitToStart(feature, motion)

    this.buffer.push(feature)
    this.quiet = motion < this.config.stopThreshold ? this.quiet + 1 : 0

    const settled =
      this.quiet >= this.config.quietFrames && this.buffer.length >= this.config.minFrames
    if (settled || this.buffer.length >= this.config.maxFrames || !hasHands) {
      return this.buffer.length >= this.config.minFrames ? this.finish() : this.abort()
    }

    return null
  }

  /**
   * Holds a rolling pre-roll while the signer settles into position after tapping.
   *
   * Only the last few frames are kept, so a long pause before starting does not pad the
   * take with dead frames — but the moment before movement is preserved, which matters
   * for signs that begin from an already-raised hand.
   */
  private waitToStart(feature: Float32Array, motion: number): Sequence | null {
    this.armed += 1

    this.buffer.push(feature)
    if (this.buffer.length > this.config.prerollFrames) this.buffer.shift()

    if (motion > this.config.startThreshold) {
      this.state = 'capturing'
      this.quiet = 0
      return null
    }

    return this.armed >= this.config.armTimeoutFrames ? this.abort() : null
  }

  /** Arms a tap-to-sign capture: recording starts on the signer's first movement. */
  forceStart() {
    this.manual = true
    this.state = 'armed'
    this.buffer = []
    this.quiet = 0
    this.armed = 0
  }

  /** Cancels or cuts short a tap-driven capture. */
  forceStop(): Sequence | null {
    if (this.state === 'idle') return null
    const captured =
      this.state === 'capturing' && this.buffer.length >= this.config.minFrames
        ? this.finish()
        : this.abort()
    this.manual = false
    return captured
  }

  reset() {
    this.state = 'idle'
    this.buffer = []
    this.prev = null
    this.quiet = 0
    this.armed = 0
    this.manual = false
  }

  private begin() {
    this.state = 'capturing'
    this.buffer = []
    this.quiet = 0
    this.armed = 0
  }

  private finish(): Sequence {
    // Trimming happens here, at the one place captures complete, so recorded templates
    // and live attempts are always processed identically.
    const captured = trimToMotion(this.buffer)
    this.state = 'idle'
    this.buffer = []
    this.quiet = 0
    this.armed = 0
    this.manual = false
    return captured
  }

  private abort(): null {
    this.state = 'idle'
    this.buffer = []
    this.quiet = 0
    this.armed = 0
    this.manual = false
    return null
  }
}
