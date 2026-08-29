import type { GestureId } from '../content/gestures'

/** A landmark in MediaPipe's normalized image space. */
export type Landmark = { x: number; y: number; z?: number }

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export type HandGeometry = {
  /** Extension of index, middle, ring, pinky — 0 curled, 1 straight. */
  ext: [number, number, number, number]
  /** How far the thumb sits clear of the palm. */
  thumbOut: number
  /** Whether the thumb tip is above its own base. */
  thumbUp: number
  /** 1 when every finger is curled. */
  closed: number
}

/**
 * Reads finger extension straight off the 21 hand landmarks.
 *
 * A finger counts as extended when its tip sits much further from the wrist than its
 * middle joint. That ratio is rotation-invariant, unlike comparing raw y values, so a
 * tilted hand scores the same as a square one.
 */
export function handGeom(lm: Landmark[]): HandGeometry {
  const D = (a: number, b: number) => Math.hypot(lm[a].x - lm[b].x, lm[a].y - lm[b].y)
  const scale = Math.max(D(0, 9), 1e-6)

  const ext = ([[8, 6], [12, 10], [16, 14], [20, 18]] as const).map(([tip, pip]) =>
    clamp01((D(tip, 0) / D(pip, 0) - 1.05) / 0.42),
  ) as [number, number, number, number]

  const thumbOut = clamp01((D(4, 17) / scale - 1.0) / 0.65)
  const thumbUp = clamp01(((lm[2].y - lm[4].y) / scale - 0.1) / 0.55)

  return { ext, thumbOut, thumbUp, closed: 1 - Math.max(...ext) }
}

/**
 * Scores the landmarks directly against a target shape, as a second opinion on the
 * canned classifier.
 *
 * The canned head confuses Thumb_Up with Closed_Fist, because a thumbs-up *is* a closed
 * fist plus one thumb. The landmarks themselves are unambiguous, so we score the shape
 * here and take whichever of the two evidences is stronger.
 */
export function geomScore(lm: Landmark[], gesture: GestureId): number {
  const h = handGeom(lm)
  const [i, m, r, p] = h.ext

  switch (gesture) {
    // Orientation nudges the score but never zeroes it — a tilted thumbs-up is
    // still a thumbs-up to anyone watching.
    case 'Thumb_Up':
      return h.closed * h.thumbOut * (0.62 + 0.38 * h.thumbUp)
    case 'Closed_Fist':
      return h.closed * (1 - 0.65 * h.thumbOut)
    case 'Open_Palm':
      return Math.min(i, m, r, p) * (0.5 + 0.5 * h.thumbOut)
    case 'Victory':
      return Math.min(i, m) * Math.min(1 - r, 1 - p)
    case 'Pointing_Up':
      return i * Math.min(1 - m, 1 - r, 1 - p) * (1 - 0.4 * h.thumbOut)
    case 'ILoveYou':
      return Math.min(i, p) * Math.min(1 - m, 1 - r) * h.thumbOut
    default:
      return 0
  }
}
