import { SIXSEVEN_TILT } from '../content/rules'

/** Tilt beyond this is drawn pinned — the beam runs out of travel before the hands do. */
const FULL = 1.2
const SWING = 42
const MID = 75
const COMMIT = (SIXSEVEN_TILT / FULL) * SWING

/** A signage palm, in the same rounded-bar language as the pictogram. */
function Palm({ x, y, fill, flip }: { x: number; y: number; fill: string; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})${flip ? ' scale(-1 1)' : ''}`}>
      {[
        { x: -21, len: 30 },
        { x: -7, len: 35 },
        { x: 7, len: 33 },
        { x: 21, len: 26 },
      ].map((f) => (
        <rect key={f.x} x={f.x - 5} y={-f.len} width="10" height={f.len + 10} rx="5" fill={fill} />
      ))}
      <rect x="-32" y="-2" width="10" height="24" rx="5" fill={fill} transform="rotate(-30 -27 10)" />
      <rect x="-26" y="-4" width="52" height="28" rx="12" fill={fill} />
    </g>
  )
}

/**
 * The live pair, riding a see-saw.
 *
 * The dashed lines are where a beat commits. Without them the tilt threshold is
 * invisible and a player rocking their hands two inches has no way to learn that it
 * isn't enough — they just watch a counter refuse to move.
 */
export function SeeSaw({ tilt, valid }: { tilt: number; valid: boolean }) {
  const offset = Math.max(-1, Math.min(1, tilt / FULL)) * SWING
  const committed = Math.abs(tilt) >= SIXSEVEN_TILT
  const fill = !valid ? 'var(--line)' : committed ? 'var(--go)' : 'var(--signal)'

  const leftY = MID - offset
  const rightY = MID + offset

  return (
    <svg viewBox="0 0 280 150" role="img" aria-label="Live hand positions" style={{ width: '100%' }}>
      <g stroke="var(--line)" strokeWidth="1.5" strokeDasharray="5 5">
        <line x1="14" y1={MID - COMMIT} x2="266" y2={MID - COMMIT} />
        <line x1="14" y1={MID + COMMIT} x2="266" y2={MID + COMMIT} />
      </g>

      <line
        x1="62"
        y1={leftY}
        x2="218"
        y2={rightY}
        stroke={valid ? 'var(--cyan)' : 'var(--line)'}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="M140 79 l-9 16 h18 z" fill="var(--line)" />

      <Palm x={62} y={leftY} fill={fill} />
      <Palm x={218} y={rightY} fill={fill} flip />
    </svg>
  )
}
