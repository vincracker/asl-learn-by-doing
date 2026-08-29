import { GESTURES, type GestureId } from '../content/gestures'

const COLUMNS = [
  { x: 32, w: 12, len: 44 }, // index
  { x: 47, w: 12, len: 50 }, // middle
  { x: 62, w: 12, len: 46 }, // ring
  { x: 77, w: 12, len: 36 }, // pinky
]

/**
 * A parametric signage-style hand, drawn from the gesture's own finger flags.
 *
 * Parametric rather than six hand-drawn icons: adding a seventh shape to GESTURES
 * gets a pictogram for free, and the set can never drift out of sync with the data.
 */
export function HandPictogram({
  gesture,
  accent = 'var(--signal)',
}: {
  gesture: GestureId
  accent?: string
}) {
  const meta = GESTURES[gesture]
  const [thumb, ...rest] = meta.fingers

  return (
    <svg viewBox="0 0 140 160" role="img" aria-label={meta.label}>
      {meta.motion === 'wave' && (
        <>
          <path d="M100 34 q10 -9 20 0" stroke={accent} strokeWidth="3" fill="none" opacity=".6" strokeLinecap="round" />
          <path d="M104 46 q10 -9 20 0" stroke={accent} strokeWidth="3" fill="none" opacity=".35" strokeLinecap="round" />
        </>
      )}

      {thumb ? (
        <rect x="6" y="78" width="13" height="42" rx="6.5" fill={accent} transform="rotate(-32 12 100)" />
      ) : (
        <rect x="24" y="92" width="40" height="13" rx="6.5" fill={accent} opacity=".34" />
      )}

      {COLUMNS.map((f, i) =>
        rest[i] ? (
          <rect
            key={f.x}
            x={f.x}
            y={72 - f.len}
            width={f.w}
            height={f.len + 14}
            rx={f.w / 2}
            fill={accent}
          />
        ) : (
          <rect key={f.x} x={f.x} y={60} width={f.w} height={26} rx={f.w / 2} fill={accent} opacity=".34" />
        ),
      )}

      <rect x="28" y="70" width="64" height="62" rx="15" fill={accent} />
    </svg>
  )
}
