import type { DrawingUtils } from '@mediapipe/tasks-vision'
import type { GestureId } from '../content/gestures'
import { NO_LABEL, scoreFrame, type FrameScore } from '../recognition/scoreFrame'
import { drawHands } from '../vision/drawHands'
import { getPracticeGesture } from '../vision/practiceKeys'
import type { Detector } from '../vision/recognizer'

const BLANK: FrameScore = { conf: 0, label: NO_LABEL, mScore: 0, gScore: 0 }

export type FrameSource = {
  detector: Detector | null
  video: HTMLVideoElement | null
  canvas: HTMLCanvasElement | null
  ctx: CanvasRenderingContext2D | null
  draw: DrawingUtils | null
  /** True when the model or the camera is unavailable and keys 1-6 stand in. */
  keysOnly: boolean
}

/**
 * Reads one frame of evidence for `target`, from the camera when it is available and
 * from the keyboard stand-in when it is not.
 *
 * Both game modes funnel through here so the live readout, the scenario score and the
 * rush counter can never be looking at different numbers.
 */
export function readFrame(src: FrameSource, target: GestureId, now: number): FrameScore {
  if (src.keysOnly) {
    const held = getPracticeGesture()
    return { conf: held === target ? 0.94 : 0, label: held ?? NO_LABEL, mScore: 0, gScore: 0 }
  }

  const { detector, video, canvas, ctx } = src
  if (!detector || !video || !canvas || !ctx || video.readyState < 2) return BLANK

  let result
  try {
    result = detector.recognizer.recognizeForVideo(video, now)
  } catch {
    // recognizeForVideo throws if two frames land on the same timestamp. One
    // dropped frame is invisible; the dropout bridge covers it.
    return BLANK
  }

  drawHands(ctx, src.draw, video, canvas, result.landmarks)
  return scoreFrame(result, target)
}
