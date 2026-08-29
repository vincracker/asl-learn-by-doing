/** A single 3D landmark in MediaPipe's normalized image space (x,y in 0..1). */
export type Point3 = { x: number; y: number; z: number }

export type Handedness = 'Left' | 'Right'

/** One hand observed in one video frame. */
export type HandObs = {
  handedness: Handedness
  /** 21 landmarks, MediaPipe hand topology. */
  landmarks: Point3[]
}

/** Face anchor: the body-relative origin all hand positions are measured against. */
export type FaceObs = {
  centerX: number
  centerY: number
  /** Bounding-box width in normalized units; our unit of "one face wide". */
  width: number
}

/** Everything the vision layer extracts from one video frame. */
export type Frame = {
  timestampMs: number
  hands: HandObs[]
  face: FaceObs | null
}
