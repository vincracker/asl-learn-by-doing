import type { Frame, HandObs, Point3 } from '../vision/types'

/**
 * MIRRORING CONVENTION — read before touching anything in this file.
 *
 * The on-screen preview is mirrored (CSS `scaleX(-1)`) because an un-mirrored selfie
 * view is disorienting to sign into. MediaPipe is fed the RAW, UN-MIRRORED frame, so
 * every coordinate here is in un-mirrored image space and `handedness` labels mean what
 * they say. Nothing downstream should flip coordinates again — the flip is purely a
 * display concern. Getting this wrong yields a recognizer that scores everything low
 * without ever erroring.
 *
 * Left-handed signers are handled by `mirrorFeature`, applied to the TEMPLATE at match
 * time, never to the live frame.
 */

// MediaPipe hand topology indices we anchor on.
const WRIST = 0
const INDEX_MCP = 5
const MIDDLE_MCP = 9
const PINKY_MCP = 17

export const SHAPE_LEN = 63 // 21 landmarks x 3 axes
export const LOC_LEN = 3
export const ORIENT_LEN = 3
export const HAND_LEN = SHAPE_LEN + LOC_LEN + ORIENT_LEN // 69
export const FEATURE_LEN = HAND_LEN * 2 + 2 // both hands + a presence flag each

/** Index of each hand's presence flag at the tail of the vector. */
const RIGHT_PRESENT = HAND_LEN * 2
const LEFT_PRESENT = HAND_LEN * 2 + 1

/**
 * Flattens one frame into a fixed-length feature vector.
 *
 * Layout: [ right hand 69 | left hand 69 | rightPresent | leftPresent ]
 * Slots for an absent hand are zero-filled and flagged, so distance can ignore them.
 */
export function frameToFeature(frame: Frame): Float32Array {
  const out = new Float32Array(FEATURE_LEN)

  for (const hand of frame.hands) {
    const base = hand.handedness === 'Right' ? 0 : HAND_LEN
    writeHand(out, base, hand, frame)
    out[hand.handedness === 'Right' ? RIGHT_PRESENT : LEFT_PRESENT] = 1
  }

  return out
}

function writeHand(out: Float32Array, base: number, hand: HandObs, frame: Frame) {
  const shape = handShape(hand.landmarks)
  out.set(shape, base)
  out.set(handLocation(hand.landmarks, frame), base + SHAPE_LEN)
  out.set(palmNormal(hand.landmarks), base + SHAPE_LEN + LOC_LEN)
}

/**
 * Re-expresses the 21 landmarks in a hand-local frame so the descriptor depends only on
 * the *shape* of the hand — not where it is, how big it appears, or how it is rotated.
 *
 * Basis: origin at the wrist, +Y along wrist->middle-MCP, +X across the palm, +Z the
 * palm normal. Distances are divided by the wrist->middle-MCP length, which makes the
 * result scale-free (the learner can sit anywhere).
 */
export function handShape(landmarks: Point3[]): Float32Array {
  const out = new Float32Array(SHAPE_LEN)
  const wrist = landmarks[WRIST]

  const yAxis = normalize(sub(landmarks[MIDDLE_MCP], wrist))
  const across = sub(landmarks[INDEX_MCP], landmarks[PINKY_MCP])
  // Gram-Schmidt: strip the yAxis component so the basis is orthonormal.
  const xAxis = normalize(sub(across, scale(yAxis, dot(across, yAxis))))
  const zAxis = cross(xAxis, yAxis)

  const scaleUnit = len(sub(landmarks[MIDDLE_MCP], wrist)) || 1e-6

  for (let i = 0; i < landmarks.length; i++) {
    const v = sub(landmarks[i], wrist)
    out[i * 3] = dot(v, xAxis) / scaleUnit
    out[i * 3 + 1] = dot(v, yAxis) / scaleUnit
    out[i * 3 + 2] = dot(v, zAxis) / scaleUnit
  }

  return out
}

/**
 * Where the hand sits in signing space, measured in face-widths from the face center.
 *
 * ASL location carries meaning — the same handshape at the forehead and at the chest are
 * different signs — so this component is as important as the shape itself. Without a
 * face we return zeros and let the presence flags carry the uncertainty.
 */
export function handLocation(landmarks: Point3[], frame: Frame): Float32Array {
  const out = new Float32Array(LOC_LEN)
  const face = frame.face
  if (!face) return out

  const unit = face.width || 1e-6
  const wrist = landmarks[WRIST]
  out[0] = (wrist.x - face.centerX) / unit
  out[1] = (wrist.y - face.centerY) / unit
  out[2] = wrist.z / unit
  return out
}

/** Unit normal of the palm plane — captures palm-facing direction. */
export function palmNormal(landmarks: Point3[]): Float32Array {
  const a = sub(landmarks[INDEX_MCP], landmarks[WRIST])
  const b = sub(landmarks[PINKY_MCP], landmarks[WRIST])
  const n = normalize(cross(a, b))
  return new Float32Array([n.x, n.y, n.z])
}

/**
 * Mirrors a feature vector left/right, for signers whose dominant hand is the opposite
 * of whoever recorded the template. Applied to templates, never to live frames.
 */
export function mirrorFeature(feature: Float32Array): Float32Array {
  const out = new Float32Array(FEATURE_LEN)

  // Swap the two hand blocks, negating every x component as they move.
  for (const [from, to] of [[0, HAND_LEN], [HAND_LEN, 0]] as const) {
    for (let i = 0; i < HAND_LEN; i++) {
      // x is the first of each 3-vector across shape, location and orientation alike.
      out[to + i] = i % 3 === 0 ? -feature[from + i] : feature[from + i]
    }
  }

  out[RIGHT_PRESENT] = feature[LEFT_PRESENT]
  out[LEFT_PRESENT] = feature[RIGHT_PRESENT]
  return out
}

// --- small vector helpers -------------------------------------------------

const sub = (a: Point3, b: Point3): Point3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const scale = (a: Point3, k: number): Point3 => ({ x: a.x * k, y: a.y * k, z: a.z * k })
const dot = (a: Point3, b: Point3) => a.x * b.x + a.y * b.y + a.z * b.z
const len = (a: Point3) => Math.sqrt(dot(a, a))

const cross = (a: Point3, b: Point3): Point3 => ({
  x: a.y * b.z - a.z * b.y,
  y: a.z * b.x - a.x * b.z,
  z: a.x * b.y - a.y * b.x,
})

function normalize(a: Point3): Point3 {
  const l = len(a)
  return l < 1e-9 ? { x: 0, y: 0, z: 0 } : scale(a, 1 / l)
}
