import type { MotionAxis } from '../content/gestures'

/**
 * The top-down (or side-on) companion to the front-facing pictogram.
 *
 * Front-on, "wave side to side" and "push toward them" look nearly identical —
 * a push has almost no on-screen displacement. This inset is the second view
 * that disambiguates them, the way an assembly diagram does: a hand seen from
 * above, an arrow, and for the `z` axis the person you are signing at.
 *
 * Drawn dim and dashed on purpose: the recognizer grades the hand *shape*, not
 * the travel, so the travel must not read as another thing being scored.
 */
export function AxisInset({ axis, title }: { axis: MotionAxis; title: string }) {
  return (
    <svg className="axinset" viewBox="0 0 48 48" role="img" aria-label={title}>
      <title>{title}</title>
      {axis === 'x' && <SideToSide />}
      {axis === 'y' && <UpDown />}
      {axis === 'z' && <TowardThem />}
      {axis === 'twist' && <Twist />}
      {axis === 'steady' && <Steady />}
    </svg>
  )
}

/** Hand seen from above — the palm as a capsule, knuckles at the far edge. */
function TopHand({ y = 27, h = 15 }: { y?: number; h?: number }) {
  return (
    <>
      <rect x="17" y={y} width="14" height={h} rx="7" fill="currentColor" opacity=".55" />
      <rect x="17" y={y} width="14" height="3" rx="1.5" fill="currentColor" opacity=".9" />
    </>
  )
}

const STROKE = {
  stroke: 'currentColor',
  strokeWidth: 1.8,
  fill: 'none',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function SideToSide() {
  return (
    <>
      <TopHand />
      <path d="M12 19 Q24 11 36 19" {...STROKE} strokeDasharray="3 2.5" />
      <path d="M15.5 14.5 L11 19.5 L17 21" {...STROKE} />
      <path d="M32.5 14.5 L37 19.5 L31 21" {...STROKE} />
    </>
  )
}

function UpDown() {
  return (
    <>
      <rect x="14" y="20" width="13" height="21" rx="6.5" fill="currentColor" opacity=".55" />
      <rect x="18.5" y="7" width="4" height="14" rx="2" fill="currentColor" opacity=".9" />
      <path d="M37 32 L37 12" {...STROKE} strokeDasharray="3 2.5" />
      <path d="M33.5 15.5 L37 11 L40.5 15.5" {...STROKE} />
      <path d="M33.5 28.5 L37 33 L40.5 28.5" {...STROKE} />
    </>
  )
}

/** The only inset that draws the other person — that is what makes "forward" legible. */
function TowardThem() {
  return (
    <>
      <TopHand y={31} h={12} />
      <circle cx="24" cy="8.5" r="4.5" fill="currentColor" opacity=".9" />
      <path d="M15.5 20 Q24 12.5 32.5 20" fill="currentColor" opacity=".9" />
      <path d="M24 29 L24 24.5" {...STROKE} strokeDasharray="3 2.5" />
      <path d="M20.5 27 L24 22.5 L27.5 27" {...STROKE} />
    </>
  )
}

function Twist() {
  return (
    <>
      <TopHand />
      <path d="M12 21 A 12.5 12.5 0 0 1 36 18" {...STROKE} strokeDasharray="3 2.5" />
      <path d="M31 15 L36.5 17.5 L34 23" {...STROKE} />
    </>
  )
}

/** Not travel — the absence of it, drawn as brackets closing in on a held hand. */
function Steady() {
  return (
    <>
      <TopHand y={24} h={18} />
      <path d="M8 27 L12.5 31.5 L8 36" {...STROKE} />
      <path d="M40 27 L35.5 31.5 L40 36" {...STROKE} />
      <path d="M17 18 L31 18" {...STROKE} strokeDasharray="3 2.5" />
    </>
  )
}
