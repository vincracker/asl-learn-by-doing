import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision'

// All assets are vendored under public/mp so the app never needs a network at runtime.
const WASM_PATH = '/mp/wasm'
const MODEL_PATH = '/mp/models/gesture_recognizer.task'

export type Delegate = 'GPU' | 'CPU'

export type Detector = {
  recognizer: GestureRecognizer
  /** Which backend actually initialized — GPU is ~3-5x faster but not always available. */
  delegate: Delegate
  loadMs: number
}

let pending: Promise<Detector> | null = null

/** Loads the recognizer once; concurrent callers share the same promise. */
export function loadDetector(): Promise<Detector> {
  pending ??= createDetector()
  return pending
}

async function createDetector(): Promise<Detector> {
  const started = performance.now()
  const fileset = await FilesetResolver.forVisionTasks(WASM_PATH)

  // GPU is much faster, but WebGL can be unavailable (headless, blocklisted driver,
  // software rendering) and fails at init rather than degrading.
  try {
    const recognizer = await createWith(fileset, 'GPU')
    return { recognizer, delegate: 'GPU', loadMs: performance.now() - started }
  } catch (gpuError) {
    console.warn('[signport] GPU delegate unavailable, falling back to CPU:', gpuError)
    const recognizer = await createWith(fileset, 'CPU')
    return { recognizer, delegate: 'CPU', loadMs: performance.now() - started }
  }
}

async function createWith(
  fileset: Awaited<ReturnType<typeof FilesetResolver.forVisionTasks>>,
  delegate: Delegate,
) {
  const options = {
    baseOptions: { modelAssetPath: MODEL_PATH, delegate },
    runningMode: 'VIDEO' as const,
    // Two hands: if the other hand drifts into frame, MediaPipe tracks it instead
    // of the signing hand and the score goes to zero.
    numHands: 2,
    // The canned classifier hides anything under 0.5 by default. Thumb_Up routinely
    // sits at 0.3-0.45 while Closed_Fist takes the top slot, so at the default
    // threshold it never appears in the results at all.
    cannedGesturesClassifierOptions: { scoreThreshold: 0.08 },
  }

  try {
    return await GestureRecognizer.createFromOptions(fileset, options)
  } catch (err) {
    // Older builds reject the classifier-options key outright.
    console.warn('[signport] classifier threshold rejected, using defaults:', err)
    const { cannedGesturesClassifierOptions: _omit, ...fallback } = options
    return await GestureRecognizer.createFromOptions(fileset, fallback)
  }
}

export const HAND_CONNECTIONS = GestureRecognizer.HAND_CONNECTIONS
