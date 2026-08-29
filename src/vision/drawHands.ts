import { DrawingUtils } from '@mediapipe/tasks-vision'
import { HAND_CONNECTIONS } from './recognizer'
import type { Landmark } from '../recognition/geometry'

/** Paints the skeleton over the camera feed, in the signage palette. */
export function drawHands(
  ctx: CanvasRenderingContext2D,
  draw: DrawingUtils | null,
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  landmarks: Landmark[][] | undefined,
) {
  const width = video.videoWidth || 640
  const height = video.videoHeight || 480
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (!draw || !landmarks) return

  for (const lm of landmarks) {
    draw.drawConnectors(lm as never, HAND_CONNECTIONS, { color: '#35D6F5', lineWidth: 3 })
    draw.drawLandmarks(lm as never, { color: '#FFCE00', lineWidth: 1, radius: 3 })
  }
}
