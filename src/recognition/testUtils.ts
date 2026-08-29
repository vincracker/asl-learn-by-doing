import type { Landmark } from './geometry'

/**
 * Builds a plausible 21-point hand for a given finger configuration.
 *
 * Landmark indices follow MediaPipe's hand topology: 0 wrist, 1-4 thumb, 5-8 index,
 * 9-12 middle, 13-16 ring, 17-20 pinky. The geometry scorer only reads tips, PIP
 * joints, the wrist, index MCP (9) and pinky MCP (17), so those are the points that
 * have to be right; the rest are filled in for realism.
 */
export function makeHand(opts: {
  fingers: [boolean, boolean, boolean, boolean]
  thumbOut?: boolean
  thumbUp?: boolean
}): Landmark[] {
  const { fingers, thumbOut = false, thumbUp = false } = opts
  const lm: Landmark[] = Array.from({ length: 21 }, () => ({ x: 0, y: 0 }))

  lm[0] = { x: 0.5, y: 1.0 } // wrist
  lm[9] = { x: 0.5, y: 0.7 } // middle MCP — the scale reference, 0.3 from the wrist
  lm[17] = { x: 0.62, y: 0.74 } // pinky MCP

  // Thumb. Out means tip far from the pinky MCP; up means tip above its own base.
  lm[1] = { x: 0.44, y: 0.9 }
  lm[2] = { x: 0.4, y: 0.84 }
  lm[3] = { x: 0.38, y: 0.8 }
  lm[4] = thumbOut
    ? { x: 0.18, y: thumbUp ? 0.58 : 0.84 }
    : { x: 0.55, y: thumbUp ? 0.6 : 0.78 }

  const COLUMNS: [number, number, number, number][] = [
    [5, 6, 7, 8], // index
    [9, 10, 11, 12], // middle
    [13, 14, 15, 16], // ring
    [17, 18, 19, 20], // pinky
  ]

  COLUMNS.forEach(([mcp, pip, dip, tip], i) => {
    const x = 0.42 + i * 0.07
    if (mcp !== 9 && mcp !== 17) lm[mcp] = { x, y: 0.72 }
    lm[pip] = { x, y: 0.62 }
    // Extended: the tip runs well past the PIP, away from the wrist. Curled: the
    // tip folds back so it sits closer to the wrist than the PIP does.
    lm[dip] = fingers[i] ? { x, y: 0.5 } : { x, y: 0.66 }
    lm[tip] = fingers[i] ? { x, y: 0.38 } : { x, y: 0.71 }
  })

  return lm
}

export const HANDS = {
  openPalm: () => makeHand({ fingers: [true, true, true, true], thumbOut: true }),
  fist: () => makeHand({ fingers: [false, false, false, false] }),
  thumbUp: () => makeHand({ fingers: [false, false, false, false], thumbOut: true, thumbUp: true }),
  victory: () => makeHand({ fingers: [true, true, false, false] }),
  pointingUp: () => makeHand({ fingers: [true, false, false, false] }),
  iLoveYou: () => makeHand({ fingers: [true, false, false, true], thumbOut: true }),
}

/** Moves a whole hand, for building two-hand frames out of one template. */
export function shiftHand(lm: Landmark[], dx: number, dy: number): Landmark[] {
  return lm.map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }))
}
