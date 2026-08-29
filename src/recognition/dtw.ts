import { HAND_LEN, SHAPE_LEN, LOC_LEN, FEATURE_LEN } from './normalize'

/** A captured attempt or stored template: a time-ordered run of feature vectors. */
export type Sequence = Float32Array[]

/** Every sequence is resampled to this length before comparison, bounding DTW cost. */
export const RESAMPLE_LEN = 32

/**
 * Relative weight of each feature component in the frame distance.
 *
 * Tune here and nowhere else. Location matters as much as handshape in ASL; orientation
 * is real but noisier, so it carries less.
 */
export const WEIGHTS = { shape: 1.0, location: 1.0, orientation: 0.5 }

/** Cost charged when one sequence has a hand the other lacks. */
const PRESENCE_MISMATCH_COST = 1.5

/** Sakoe-Chiba band as a fraction of sequence length; blocks nonsense warps. */
const BAND_RATIO = 0.25

/**
 * Weighted distance between two single-frame feature vectors.
 *
 * Each hand contributes only if both sequences agree it is present; a disagreement is
 * charged a flat penalty instead, so "one hand vs two hands" reads as very different
 * without letting zero-filled slots dominate the metric.
 */
export function frameDistance(a: Float32Array, b: Float32Array): number {
  let total = 0

  for (let hand = 0; hand < 2; hand++) {
    const base = hand * HAND_LEN
    const presentA = a[HAND_LEN * 2 + hand]
    const presentB = b[HAND_LEN * 2 + hand]

    if (presentA !== presentB) {
      total += PRESENCE_MISMATCH_COST
      continue
    }
    if (!presentA) continue

    total += WEIGHTS.shape * rms(a, b, base, SHAPE_LEN)
    total += WEIGHTS.location * rms(a, b, base + SHAPE_LEN, LOC_LEN)
    total += WEIGHTS.orientation * rms(a, b, base + SHAPE_LEN + LOC_LEN, 3)
  }

  return total
}

function rms(a: Float32Array, b: Float32Array, offset: number, length: number): number {
  let sum = 0
  for (let i = offset; i < offset + length; i++) {
    const d = a[i] - b[i]
    sum += d * d
  }
  return Math.sqrt(sum / length)
}

/**
 * Dynamic Time Warping distance, normalized by path length so it is comparable across
 * sequences. Constrained to a Sakoe-Chiba band: without it, DTW happily matches a
 * gesture against a wildly time-distorted version of a different one.
 *
 * Both inputs are resampled to a common length first, so the band is symmetric.
 */
export function dtwDistance(a: Sequence, b: Sequence): number {
  if (a.length === 0 || b.length === 0) return Infinity

  const x = resample(a, RESAMPLE_LEN)
  const y = resample(b, RESAMPLE_LEN)
  const n = x.length
  const band = Math.max(1, Math.floor(n * BAND_RATIO))

  // Rolling two-row cost matrix — the full n*n matrix is never needed.
  let prev = new Float64Array(n + 1).fill(Infinity)
  let curr = new Float64Array(n + 1).fill(Infinity)
  prev[0] = 0

  for (let i = 1; i <= n; i++) {
    curr.fill(Infinity)
    const lo = Math.max(1, i - band)
    const hi = Math.min(n, i + band)

    for (let j = lo; j <= hi; j++) {
      const cost = frameDistance(x[i - 1], y[j - 1])
      const best = Math.min(prev[j], curr[j - 1], prev[j - 1])
      curr[j] = cost + best
    }

    const swap = prev
    prev = curr
    curr = swap
  }

  // Path through a square, banded matrix has ~2n steps; normalizing keeps the scale
  // stable regardless of RESAMPLE_LEN.
  return prev[n] / (2 * n)
}

/**
 * Linearly resamples a sequence to exactly `length` frames, interpolating between
 * neighbours. Presence flags are snapped rather than blended — a half-present hand is
 * not a meaningful state.
 */
export function resample(seq: Sequence, length: number): Sequence {
  if (seq.length === length) return seq
  if (seq.length === 1) return Array.from({ length }, () => seq[0])

  const out: Sequence = []
  for (let i = 0; i < length; i++) {
    const pos = (i * (seq.length - 1)) / (length - 1)
    const lo = Math.floor(pos)
    const hi = Math.min(lo + 1, seq.length - 1)
    const t = pos - lo
    out.push(lerpFrame(seq[lo], seq[hi], t))
  }
  return out
}

function lerpFrame(a: Float32Array, b: Float32Array, t: number): Float32Array {
  const out = new Float32Array(FEATURE_LEN)
  const presenceStart = HAND_LEN * 2

  for (let i = 0; i < presenceStart; i++) out[i] = a[i] + (b[i] - a[i]) * t
  for (let i = presenceStart; i < FEATURE_LEN; i++) out[i] = t < 0.5 ? a[i] : b[i]

  return out
}
