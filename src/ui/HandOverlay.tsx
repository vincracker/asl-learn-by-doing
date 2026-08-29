import { useEffect, useRef } from 'react'
import type { Frame } from '../vision/types'

/** MediaPipe hand topology: pairs of landmark indices that form the skeleton. */
const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],           // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],           // index
  [5, 9], [9, 10], [10, 11], [11, 12],      // middle
  [9, 13], [13, 14], [14, 15], [15, 16],    // ring
  [13, 17], [17, 18], [18, 19], [19, 20],   // pinky
  [0, 17],                                   // palm edge
]

type Props = {
  /** Ref holding the newest frame; read during rAF so the overlay never re-renders. */
  frameRef: React.RefObject<Frame | null>
  active: boolean
  showFace?: boolean
}

/**
 * Draws the tracked skeleton over the video.
 *
 * Reads the frame from a ref inside its own animation loop rather than taking it as a
 * prop — passing 30-60 frames/sec through React state would cause a re-render storm.
 */
export function HandOverlay({ frameRef, active, showFace = true }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    let raf = 0
    const draw = () => {
      raf = requestAnimationFrame(draw)
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      const { width, height } = canvas.getBoundingClientRect()
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const frame = frameRef.current
      if (!frame) return

      if (showFace && frame.face) drawFace(ctx, frame, canvas)
      for (const hand of frame.hands) drawHand(ctx, hand.landmarks, canvas, active)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [frameRef, active, showFace])

  // Mirrored to match the video preview; see the convention note in normalize.ts.
  return <canvas ref={canvasRef} className="overlay" />
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  landmarks: Frame['hands'][number]['landmarks'],
  canvas: HTMLCanvasElement,
  active: boolean,
) {
  const px = (i: number) => [landmarks[i].x * canvas.width, landmarks[i].y * canvas.height] as const

  ctx.lineWidth = 3
  ctx.strokeStyle = active ? 'rgba(94, 234, 212, 0.95)' : 'rgba(148, 163, 184, 0.7)'
  ctx.beginPath()
  for (const [a, b] of BONES) {
    ctx.moveTo(...px(a))
    ctx.lineTo(...px(b))
  }
  ctx.stroke()

  ctx.fillStyle = active ? '#5eead4' : '#cbd5e1'
  for (let i = 0; i < landmarks.length; i++) {
    const [x, y] = px(i)
    ctx.beginPath()
    ctx.arc(x, y, i === 0 ? 5 : 3, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawFace(ctx: CanvasRenderingContext2D, frame: Frame, canvas: HTMLCanvasElement) {
  const face = frame.face
  if (!face) return
  const w = face.width * canvas.width
  const h = w * 1.3
  ctx.strokeStyle = 'rgba(129, 140, 248, 0.45)'
  ctx.lineWidth = 2
  ctx.strokeRect(face.centerX * canvas.width - w / 2, face.centerY * canvas.height - h / 2, w, h)
}
