import { GESTURES, type GestureId } from '../content/gestures'
import { AxisInset } from './AxisInset'

/** [centre x, width, proximal length, distal length, fan angle at full spread] */
const FINGERS = [
  { x: 50, w: 13, l1: 27, l2: 21, fan: -10 }, // index
  { x: 65, w: 13, l1: 30, l2: 24, fan: -3.5 }, // middle
  { x: 80, w: 13, l1: 28, l2: 22, fan: 4 }, // ring
  { x: 95, w: 12, l1: 22, l2: 17, fan: 11 }, // pinky
]

const BASE_Y = 80

/**
 * A signage-style hand, articulated and in motion, drawn from the gesture's own data.
 *
 * Two things changed from the flat version. Fingers are two segments hinged at the
 * knuckle, so `curl` is a continuous number rather than a long-bar/short-bar switch —
 * a folded finger is genuinely folded, not a stub. And the whole hand rides one of
 * five CSS travel animations keyed off `meta.axis`, drawn three times over: the same
 * animation with a negative delay puts two faint copies slightly further along the
 * cycle, so a trail falls out for free and takes the shape of the travel — fanned out
 * beside a wave, a concentric halo around a push forward, which is what keeps those two
 * from looking identical head-on.
 *
 * Parametric rather than hand-drawn frames: adding a seventh shape to GESTURES gets a
 * moving pictogram for free, the set can never drift out of sync with the data, and the
 * whole thing recolours with `accent`. `prefers-reduced-motion` is already handled
 * globally in index.css, which freezes every hand on its target pose.
 */
export function HandPictogram({
  gesture,
  accent = 'var(--signal)',
  size = 'md',
}: {
  gesture: GestureId
  accent?: string
  size?: 'sm' | 'md'
}) {
  const meta = GESTURES[gesture]
  const travel = `hand ax-${meta.axis}`

  return (
    <div className={`handfig handfig--${size}`}>
      <svg className="handfig__hand" viewBox="6 -6 156 164" role="img" aria-label={meta.label}>
        {/* Onion skin. Identical animation, run a beat further along. */}
        <g className={travel} style={{ animationDelay: '-.17s', opacity: 0.11 }} aria-hidden="true">
          <Hand meta={meta} accent={accent} />
        </g>
        <g className={travel} style={{ animationDelay: '-.09s', opacity: 0.24 }} aria-hidden="true">
          <Hand meta={meta} accent={accent} />
        </g>
        <g className={travel}>
          <Hand meta={meta} accent={accent} />
        </g>
      </svg>

      <div className="handfig__travel">
        <AxisInset axis={meta.axis} title={meta.motionHint} />
        <span className="handfig__hint">{meta.motionHint}</span>
      </div>
    </div>
  )
}

function Hand({ meta, accent }: { meta: (typeof GESTURES)[GestureId]; accent: string }) {
  const [thumb, ...rest] = meta.curl

  // Every part is stroked in the panel colour rather than outlined in ink, so
  // overlaps read as background showing through: the seam between two fingers,
  // and the knuckle line where the palm crosses them. Solid-on-solid without it
  // collapses the whole hand into one mitten.
  return (
    <g
      fill={accent}
      stroke="var(--handfig-seam, #1F272F)"
      strokeWidth="2.6"
      strokeLinejoin="round"
      transform="translate(24 0)"
    >
      {FINGERS.map((f, i) => (
        <Finger key={f.x} {...f} fan={f.fan * meta.spread} curl={rest[i]} />
      ))}

      <rect x="40" y="76" width="64" height="64" rx="16" />
      <rect x="53" y="136" width="38" height="16" rx="8" opacity=".55" />

      {/* A thumb splays out beside an open hand and stands up beside a closed one.
          Derived from the other four rather than authored, so it stays true for
          any shape added later. */}
      <Thumb curl={thumb} lift={rest.reduce((a, c) => a + c, 0) / rest.length} />
    </g>
  )
}

/** A curling finger also turns toward the camera, so it shortens as it folds. */
const FORESHORTEN = 0.44

/**
 * Knuckle then second joint, nested so the fold compounds, and foreshortened as
 * it goes. At curl 1 the tip lands back at the top of the palm and the whole
 * finger occupies a knuckle's worth of height — without the shortening a folded
 * finger stands as tall as a raised one and the shape stops reading.
 */
function Finger({
  x,
  w,
  l1,
  l2,
  fan,
  curl,
}: {
  x: number
  w: number
  l1: number
  l2: number
  fan: number
  curl: number
}) {
  const s = 1 - FORESHORTEN * curl
  return (
    <g transform={`translate(${x} ${BASE_Y}) rotate(${fan})`}>
      <g transform={`rotate(${curl * 28})`}>
        <rect x={-w / 2} y={-l1 * s} width={w} height={l1 * s + w / 2} rx={w / 2} />
        <g transform={`translate(0 ${-l1 * s}) rotate(${curl * 146})`}>
          <rect x={-w / 2} y={-l2 * s} width={w} height={l2 * s + w / 2} rx={w / 2} />
        </g>
      </g>
    </g>
  )
}

/**
 * Hinged low on the left edge of the palm, not inside it — anchored there the
 * extended thumb breaks the silhouette (which is the whole tell for Thumb up)
 * and the folded one lies across the fingers instead of floating on the palm.
 */
function Thumb({ curl, lift }: { curl: number; lift: number }) {
  const s = 1 - 0.34 * curl
  return (
    <g transform="translate(44 118)">
      <g transform={`rotate(${-34 + lift * 25 + curl * 68})`}>
        <rect x="-7.5" y={-34 * s} width="15" height={34 * s + 7.5} rx="7.5" />
        <g transform={`translate(0 ${-34 * s}) rotate(${curl * 30})`}>
          <rect x="-7.5" y={-27 * s} width="15" height={27 * s + 7.5} rx="7.5" />
        </g>
      </g>
    </g>
  )
}
