import type { DrawingUtils } from '@mediapipe/tasks-vision'
import type { GestureId } from '../content/gestures'
import { SIXSEVEN_TILT } from '../content/rules'
import { NO_LABEL, scoreFrame, type FrameScore, type RecognizerResult } from '../recognition/scoreFrame'
import { NO_POSE, readPose, type Pose } from '../recognition/sixSeven'
import { drawHands } from '../vision/drawHands'
import { getPracticeGesture, getPracticePole } from '../vision/practiceKeys'
import type { Detector } from '../vision/recognizer'

const BLANK: FrameScore = { conf: 0, label: NO_LABEL, mScore: 0, gScore: 0 }

export type FrameSource = {
  detector: Detector | null
  video: HTMLVideoElement | null
  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
  draw: DrawingUtils | null
  /** True when the model or the camera is unavailable and the keys stand in. */
  keysOnly: boolean
}

/**
 * Runs the recognizer over the current video frame and paints the overlay.
 *
 * Shared by both readers below so a mode can never end up reading a different frame
 * from the one the player is watching.
 */
function recognize(src: FrameSource, now: number): RecognizerResult | null {
  const { detector, video, canvas, ctx } = src
  if (!detector || !video || !canvas || !ctx || video.readyState < 2) return null

  let result
  try {
    result = detector.recognizer.recognizeForVideo(video, now)
  } catch {
    // recognizeForVideo throws if two frames land on the same timestamp. One
    // dropped frame is invisible; the dropout bridge covers it.
    return null
  }

  drawHands(ctx, src.draw, video, canvas, result.landmarks)
  return result
}

/**
 * Reads one frame of evidence for `target`, from the camera when it is available and
 * from the keyboard stand-in when it is not.
 *
 * Both shape modes funnel through here so the live readout, the scenario score and the
 * rush counter can never be looking at different numbers.
 */
export function readFrame(src: FrameSource, target: GestureId, now: number): FrameScore {
  if (src.keysOnly) {
    const held = getPracticeGesture()
    return { conf: held === target ? 0.94 : 0, label: held ?? NO_LABEL, mScore: 0, gScore: 0 }
  }

  const result = recognize(src, now)
  return result ? scoreFrame(result, target) : BLANK
}

/**
 * Reads one frame of the 6-7 pose — a pair of hands rather than a single shape.
 *
 * The keys-only stand-in throws the pair to whichever side was last pressed, far enough
 * past the tilt threshold to commit, so the counter downstream can't tell the difference
 * between a keyboard and a body.
 */
export function readPoseFrame(src: FrameSource, now: number): Pose {
  if (src.keysOnly) {
    const { pole, fresh } = getPracticePole(now)
    if (!fresh || pole === 0) return NO_POSE
    return { valid: true, form: 0.94, tilt: pole * SIXSEVEN_TILT * 1.4, fault: 'none' }
  }

  const result = recognize(src, now)
  return result ? readPose(result) : NO_POSE
}
