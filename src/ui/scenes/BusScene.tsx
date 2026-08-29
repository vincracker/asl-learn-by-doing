const STREET = (
  <>
    <rect x="0" y="96" width="60" height="114" fill="#35D6F5" opacity=".35" />
    <rect x="90" y="60" width="46" height="150" fill="#35D6F5" opacity=".25" />
    <rect x="170" y="110" width="70" height="100" fill="#35D6F5" opacity=".3" />
    <rect x="270" y="74" width="40" height="136" fill="#35D6F5" opacity=".2" />
  </>
)

/** Driver's cab: the street sliding past the windscreen, route blade, stop button. */
export function BusScene() {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="640" height="400" fill="#1B222A" />
      <rect x="40" y="30" width="560" height="180" fill="#0E141A" />

      {/* Two copies of the same street, offset by a full loop, so it never shows a seam. */}
      <g opacity=".55">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="640 0"
            to="-320 0"
            dur="9s"
            repeatCount="indefinite"
          />
          {STREET}
        </g>
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            from="960 0"
            to="0 0"
            dur="9s"
            repeatCount="indefinite"
          />
          {STREET}
        </g>
      </g>

      <rect x="40" y="30" width="150" height="34" fill="#FFCE00" />
      <text
        x="52"
        y="56"
        fontFamily="Archivo Narrow, Arial Narrow, sans-serif"
        fontSize="22"
        fill="#101418"
        letterSpacing="3"
      >
        431 CITY
      </text>

      <rect x="0" y="210" width="640" height="190" fill="#131A21" />
      <circle cx="440" cy="300" r="62" fill="none" stroke="#2C3742" strokeWidth="14" />
      <circle cx="440" cy="300" r="12" fill="#2C3742" />

      <g transform="translate(420,150)">
        <circle cx="0" cy="0" r="30" fill="#8FA0AF" />
        <path d="M-54 120 q0 -68 54 -68 q54 0 54 68 z" fill="#FFCE00" />
      </g>

      <rect x="120" y="90" width="10" height="310" fill="#2C3742" />
      <circle cx="125" cy="250" r="17" fill="#FF6B5A">
        <animate attributeName="opacity" values="1;.45;1" dur="2.8s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
