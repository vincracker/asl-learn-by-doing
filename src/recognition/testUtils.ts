import type { Frame, Handedness, Point3 } from '../vision/types'

/** Deterministic pseudo-random so fixtures are stable across runs. */
function rng(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

/** A synthetic but structurally valid 21-landmark hand. */
export function makeHand(seed = 1): Point3[] {
  const rand = rng(seed)
  const pts: Point3[] = [{ x: 0.5, y: 0.6, z: 0 }] // wrist
  for (let i = 1; i < 21; i++) {
    pts.push({
      x: 0.5 + (rand() - 0.5) * 0.2,
      y: 0.6 - rand() * 0.25,
      z: (rand() - 0.5) * 0.05,
    })
  }
  return pts
}

export function makeFrame(
  landmarks: Point3[],
  opts: { handedness?: Handedness; face?: Frame['face']; timestampMs?: number } = {},
): Frame {
  return {
    timestampMs: opts.timestampMs ?? 0,
    hands: [{ handedness: opts.handedness ?? 'Right', landmarks }],
    face: opts.face === undefined ? { centerX: 0.5, centerY: 0.3, width: 0.2 } : opts.face,
  }
}

export const translate = (pts: Point3[], dx: number, dy: number, dz = 0): Point3[] =>
  pts.map((p) => ({ x: p.x + dx, y: p.y + dy, z: p.z + dz }))

export const scalePts = (pts: Point3[], k: number): Point3[] =>
  pts.map((p) => ({ x: p.x * k, y: p.y * k, z: p.z * k }))

/** Rotates about the Z axis through the origin. */
export function rotateZ(pts: Point3[], radians: number): Point3[] {
  const c = Math.cos(radians)
  const s = Math.sin(radians)
  return pts.map((p) => ({ x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z }))
}

/**
 * A flat "B" handshape (all fingers extended, palm flat) positioned with the wrist at
 * (x, y). Used to build HELLO/THANK-YOU fixtures, which share this handshape and differ
 * almost entirely in where they start relative to the face.
 */
export function flatHand(x: number, y: number): Point3[] {
  // Columns of the four fingers, plus the thumb offset to the side.
  const fingerX = [0.055, 0.018, -0.018, -0.055]
  const pts: Point3[] = [{ x, y, z: 0 }]

  // Thumb: CMC -> TIP, angled away from the palm.
  for (let j = 1; j <= 4; j++) {
    pts.push({ x: x + 0.02 + j * 0.022, y: y - j * 0.018, z: 0 })
  }

  // Four fingers: MCP, PIP, DIP, TIP running up from the wrist.
  for (const fx of fingerX) {
    for (let j = 1; j <= 4; j++) {
      pts.push({ x: x + fx, y: y - 0.05 - j * 0.028, z: 0 })
    }
  }

  return pts
}
