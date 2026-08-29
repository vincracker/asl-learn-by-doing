export type CategoryArtId = 'airport' | 'bus' | 'rush' | 'guess' | 'learn'

/**
 * Flat signage illustrations for the category grid.
 *
 * Ink comes from `currentColor` and the one highlight from --accent, so the set
 * re-themes with everything else rather than carrying its own palette.
 */
export function CategoryArt({ id }: { id: CategoryArtId }) {
  return ART[id]
}

const ART: Record<CategoryArtId, React.ReactElement> = {
  // a hand framed by the camera, three signs to go
  learn: (
    <svg viewBox="0 0 200 140" role="img" aria-label="A hand framed by the camera, three signs to go">
      <g stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round">
        <path d="M14 36V14h22" />
        <path d="M164 14h22v22" />
        <path d="M14 104v22h22" />
        <path d="M186 104v22h-22" />
      </g>
      <g transform="translate(100 60) scale(.6) translate(-80 -67)">
        <rect x="56" y="30" width="14" height="46" rx="7" fill="currentColor" />
        <rect x="74" y="22" width="14" height="54" rx="7" fill="currentColor" />
        <rect x="92" y="26" width="14" height="50" rx="7" fill="currentColor" />
        <rect x="110" y="36" width="14" height="40" rx="7" fill="currentColor" />
        <rect x="34" y="58" width="14" height="36" rx="7" fill="currentColor" transform="rotate(-32 41 76)" />
        <rect x="54" y="66" width="72" height="46" rx="16" fill="currentColor" />
      </g>
      <rect x="59" y="105" width="22" height="6" rx="3" fill="var(--accent)" />
      <rect x="89" y="105" width="22" height="6" rx="3" fill="currentColor" opacity=".22" />
      <rect x="119" y="105" width="22" height="6" rx="3" fill="currentColor" opacity=".22" />
    </svg>
  ),

  // a plane climbing away from the gate
  airport: (
    <svg viewBox="0 0 200 140" role="img" aria-label="A plane climbing away from the gate">
      <path
        d="M20 120C56 116 92 96 124 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="6 10"
        opacity=".4"
      />
      <circle cx="20" cy="120" r="7" fill="var(--accent)" />
      <g transform="translate(104 64) rotate(34) scale(.78) translate(-100 -72)">
        <path
          d="M100 26c6 0 10 8 10 18v10l38 22v12l-38-10v22l14 10v9l-24-6-24 6v-9l14-10V78l-38 10V76l38-22V44c0-10 4-18 10-18z"
          fill="currentColor"
        />
      </g>
    </svg>
  ),

  // a bus pulled up at a stop, door open
  bus: (
    <svg viewBox="0 0 200 140" role="img" aria-label="A bus at a stop with its door open">
      <path d="M14 118h172" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" opacity=".4" />
      <rect x="18" y="30" width="120" height="62" rx="13" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <rect x="31" y="43" width="28" height="22" rx="5" fill="currentColor" opacity=".22" />
      <rect x="66" y="43" width="28" height="22" rx="5" fill="currentColor" opacity=".22" />
      <rect x="103" y="43" width="26" height="45" rx="5" fill="var(--accent)" />
      <path d="M116 43v45" stroke="currentColor" strokeWidth="2.5" opacity=".45" />
      <circle cx="47" cy="98" r="11.5" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <circle cx="115" cy="98" r="11.5" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <path d="M170 118V52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="170" cy="40" r="14" fill="var(--accent)" />
      <path d="M163 40h14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),

  // sixty seconds on the clock
  rush: (
    <svg viewBox="0 0 200 140" role="img" aria-label="A stopwatch running down">
      <circle cx="100" cy="80" r="42" fill="none" stroke="currentColor" strokeWidth="3.5" />
      <path d="M100 38a42 42 0 0 1 37 62" fill="none" stroke="var(--accent)" strokeWidth="7" strokeLinecap="round" />
      <rect x="90" y="22" width="20" height="11" rx="4" fill="currentColor" />
      <path d="M136 46l10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M100 80V56" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M100 80l19 12" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="100" cy="80" r="4.5" fill="currentColor" />
    </svg>
  ),

  // any shape you like, and the model has a go
  guess: (
    <svg viewBox="0 0 200 140" role="img" aria-label="A hand and a question mark">
      <rect x="56" y="30" width="14" height="46" rx="7" fill="currentColor" />
      <rect x="74" y="22" width="14" height="54" rx="7" fill="currentColor" />
      <rect x="92" y="26" width="14" height="50" rx="7" fill="currentColor" />
      <rect x="110" y="36" width="14" height="40" rx="7" fill="currentColor" />
      <rect x="34" y="58" width="14" height="36" rx="7" fill="currentColor" transform="rotate(-32 41 76)" />
      <rect x="54" y="66" width="72" height="46" rx="16" fill="currentColor" />
      <circle cx="156" cy="42" r="21" fill="var(--accent)" />
      <text x="156" y="51" textAnchor="middle" fontSize="27" fontWeight="700" fill="currentColor">
        ?
      </text>
    </svg>
  ),
}
