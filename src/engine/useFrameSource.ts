import { DrawingUtils } from '@mediapipe/tasks-vision'
import { useCallback, useEffect, useRef, type RefObject } from 'react'
import type { FrameSource } from './readFrame'
import type { Detector } from '../vision/recognizer'

export type FrameRefs = {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
}

type Inputs = { refs: FrameRefs; detector: Detector | null; keysOnly: boolean }

/**
 * Resolves the live video, canvas and drawing context into the shape `readFrame` wants.
 *
 * The returned function is stable for the component's lifetime and reads the latest
 * inputs each call. That matters: it is a dependency of the round loops, and a new
 * identity there would restart an attempt — resetting the clock — every time the
 * detector finished loading or the camera flipped to keys-only mid-round.
 *
 * The DrawingUtils instance is cached against its context, since constructing one per
 * frame allocates a WebGL-backed helper sixty times a second for no benefit.
 */
export function useFrameSource(
  refs: FrameRefs,
  detector: Detector | null,
  keysOnly: boolean,
): () => FrameSource {
  const inputs = useRef<Inputs>({ refs, detector, keysOnly })
  useEffect(() => {
    inputs.current = { refs, detector, keysOnly }
  })

  const cache = useRef<{ ctx: CanvasRenderingContext2D; draw: DrawingUtils } | null>(null)

  return useCallback(() => {
    const { refs: current, detector: det, keysOnly: keys } = inputs.current
    const video = current.videoRef.current
    const canvas = current.canvasRef.current

    let ctx: CanvasRenderingContext2D | null = null
    let draw: DrawingUtils | null = null

    if (canvas) {
      if (cache.current?.ctx.canvas === canvas) {
        ctx = cache.current.ctx
        draw = cache.current.draw
      } else {
        ctx = canvas.getContext('2d')
        if (ctx) {
          draw = new DrawingUtils(ctx)
          cache.current = { ctx, draw }
        }
      }
    }

    return { detector: det, video, canvas, ctx, draw, keysOnly: keys }
  }, [])
}
