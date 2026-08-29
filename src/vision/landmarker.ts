import {
  FilesetResolver,
  HandLandmarker,
  FaceDetector,
} from '@mediapipe/tasks-vision'
import type { Frame, FaceObs, HandObs, Handedness } from './types'

// All assets are vendored under public/mp so the app never needs a network at runtime.
const WASM_PATH = '/mp/wasm'
const HAND_MODEL = '/mp/models/hand_landmarker.task'
const FACE_MODEL = '/mp/models/blaze_face_short_range.tflite'

export type Delegate = 'GPU' | 'CPU'

export type Detectors = {
  hands: HandLandmarker
  face: FaceDetector
  /** Which backend actually initialized — GPU is ~3-5x faster but not always available. */
  delegate: Delegate
  /** Wall-clock milliseconds spent loading, for the diagnostics page. */
  loadMs: number
}

let pending: Promise<Detectors> | null = null

/** Loads both detectors once; concurrent callers share the same promise. */
export function loadDetectors(): Promise<Detectors> {
  pending ??= createDetectors()
  return pending
}

async function createDetectors(): Promise<Detectors> {
  const started = performance.now()
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH)

  // GPU is much faster, but WebGL can be unavailable (headless, blocklisted driver,
  // software rendering) and fails at init rather than degrading. Fall back rather than
  // leaving the user with a dead camera view.
  try {
    const detectors = await createWith(fileset, 'GPU')
    return { ...detectors, delegate: 'GPU', loadMs: performance.now() - started }
  } catch (gpuError) {
    console.warn('[vision] GPU delegate unavailable, falling back to CPU:', gpuError)
    const detectors = await createWith(fileset, 'CPU')
    return { ...detectors, delegate: 'CPU', loadMs: performance.now() - started }
  }
}

async function createWith(
  fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  delegate: Delegate,
) {
  const [hands, face] = await Promise.all([
    HandLandmarker.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: HAND_MODEL, delegate },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    }),
    FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: FACE_MODEL, delegate },
      runningMode: 'VIDEO',
      minDetectionConfidence: 0.5,
    }),
  ])
  return { hands, face }
}

/**
 * Runs both detectors over one video frame and flattens the results into a `Frame`.
 *
 * MediaPipe hand landmarks are already normalized to 0..1, but the face bounding box
 * comes back in *pixels* — we convert here so everything downstream shares one
 * coordinate space.
 */
export function detectFrame(
  detectors: Detectors,
  video: HTMLVideoElement,
  timestampMs: number,
): Frame {
  const handResult = detectors.hands.detectForVideo(video, timestampMs)
  const faceResult = detectors.face.detectForVideo(video, timestampMs)

  const hands: HandObs[] = handResult.landmarks.map((landmarks, i) => ({
    handedness: (handResult.handedness[i]?.[0]?.categoryName ?? 'Right') as Handedness,
    landmarks: landmarks.map((p) => ({ x: p.x, y: p.y, z: p.z })),
  }))

  return { timestampMs, hands, face: toFaceObs(faceResult.detections[0], video) }
}

function toFaceObs(
  detection: { boundingBox?: { originX: number; originY: number; width: number; height: number } } | undefined,
  video: HTMLVideoElement,
): FaceObs | null {
  const box = detection?.boundingBox
  if (!box || !video.videoWidth || !video.videoHeight) return null

  return {
    centerX: (box.originX + box.width / 2) / video.videoWidth,
    centerY: (box.originY + box.height / 2) / video.videoHeight,
    width: box.width / video.videoWidth,
  }
}
