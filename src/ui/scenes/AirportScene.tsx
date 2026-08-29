/** Check-in hall: terminal window, departure board, an agent behind the counter. */
export function AirportScene() {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="640" height="400" fill="#1B222A" />

      <rect x="30" y="24" width="580" height="150" fill="#101820" />
      <g stroke="#2C3742" strokeWidth="3">
        <line x1="180" y1="24" x2="180" y2="174" />
        <line x1="330" y1="24" x2="330" y2="174" />
        <line x1="480" y1="24" x2="480" y2="174" />
      </g>

      <g opacity=".85">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="-220 0"
            to="700 0"
            dur="14s"
            repeatCount="indefinite"
          />
          <path
            d="M60 120 l70 -8 l26 -22 l14 2 l-10 22 l40 -4 l16 -14 l12 3 l-8 15 l30 2 l0 12 l-30 2 l8 15 l-12 3 l-16 -14 l-40 -4 l10 22 l-14 2 l-26 -22 z"
            fill="#35D6F5"
            opacity=".5"
          />
        </g>
      </g>

      <rect x="392" y="196" width="218" height="70" fill="#0C1013" stroke="#2C3742" />
      <g fontFamily="Archivo Narrow, Arial Narrow, sans-serif" fontSize="17" fill="#FFCE00" letterSpacing="2">
        <text x="404" y="220">SQ 221 GATE 22</text>
        <text x="404" y="244" fill="#3DE08D">
          BOARDING 07:15
          <animate attributeName="opacity" values="1;.25;1" dur="2.4s" repeatCount="indefinite" />
        </text>
      </g>

      <rect x="0" y="300" width="640" height="100" fill="#0F151B" />
      <rect x="0" y="292" width="640" height="14" fill="#2C3742" />

      <g transform="translate(120,178)">
        <circle cx="0" cy="0" r="30" fill="#8FA0AF" />
        <path d="M-52 118 q0 -66 52 -66 q52 0 52 66 z" fill="#35D6F5" />
        <rect x="-13" y="-46" width="26" height="12" rx="3" fill="#0C1013" opacity=".5" />
      </g>

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          from="300 0"
          to="640 0"
          dur="7s"
          repeatCount="indefinite"
        />
        <rect x="0" y="252" width="52" height="40" rx="5" fill="#FFCE00" />
        <rect x="14" y="244" width="24" height="9" rx="4" fill="#FFCE00" />
      </g>
    </svg>
  )
}
