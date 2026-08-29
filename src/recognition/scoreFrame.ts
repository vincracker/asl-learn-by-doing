import type { GestureId } from '../content/gestures'
import { geomScore, type Landmark } from './geometry'

/** The subset of MediaPipe's GestureRecognizerResult this module reads. */
export type RecognizerResult = {
  gestures?: { categoryName: string; score: number }[][]
  landmarks?: Landmark[][]
}

export type FrameScore = {
  /** Combined confidence for the target shape, 0..1. */
  conf: number
  /** What the model thinks it is seeing, for the readout. */
  label: string
  /** The classifier's own score for the target. */
  mScore: number
  /** The landmark geometry's score for the target. */
  gScore: number
}

export const NO_LABEL = '—'

/**
 * One frame of evidence for `target`, from the model's own classification and from the
 * landmark geometry. Every mode goes through here so the two readings can never drift
 * apart.
 */
export function scoreFrame(res: RecognizerResult, target: GestureId): FrameScore {
  let mScore = 0
  let gScore = 0
  let label: string = NO_LABEL
  let topScore = 0

  // Search EVERY category of EVERY hand for the target. Reading only
  // res.gestures[0][0] throws the score away whenever the target comes second —
  // which is exactly what happens to Thumb_Up.
  for (const hand of res.gestures ?? []) {
    for (const cat of hand) {
      if (cat.categoryName === target) mScore = Math.max(mScore, cat.score)
    }
    const top = hand[0]
    if (top && top.score > topScore) {
      topScore = top.score
      label = top.categoryName
    }
  }

  for (const lm of res.landmarks ?? []) gScore = Math.max(gScore, geomScore(lm, target))

  // When the classifier abstains but the shape is unmistakable, name the shape.
  if ((label === NO_LABEL || label === 'None') && gScore > 0.55) label = target

  return { conf: Math.max(mScore, 0.92 * gScore), label, mScore, gScore }
}
