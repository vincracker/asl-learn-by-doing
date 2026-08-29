import { RUSH_SECONDS } from '../../content/rules'

/** AI guess: a question mark under expanding sonar rings. */
export function GuessScene() {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="640" height="400" fill="#1B222A" />
      <g fill="none" stroke="#35D6F5" strokeWidth="2" opacity=".5">
        <circle cx="320" cy="200" r="60">
          <animate attributeName="r" values="60;150;60" dur="5s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".6;0;.6" dur="5s" repeatCount="indefinite" />
        </circle>
        <circle cx="320" cy="200" r="110">
          <animate attributeName="r" values="110;190;110" dur="5s" begin="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values=".4;0;.4" dur="5s" begin="1.6s" repeatCount="indefinite" />
        </circle>
      </g>
      <text
        x="320"
        y="212"
        textAnchor="middle"
        fontFamily="Archivo Narrow, Arial Narrow, sans-serif"
        fontSize="46"
        fill="#FFCE00"
        letterSpacing="6"
      >
        ?
      </text>
    </svg>
  )
}

/** Rush hour: a split-flap housing with the clock in it, and a draining track. */
export function RushScene() {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="640" height="400" fill="#1B222A" />
      <rect x="180" y="88" width="280" height="172" rx="6" fill="#0C1013" stroke="#2C3742" strokeWidth="2" />
      <line x1="180" y1="174" x2="460" y2="174" stroke="#2C3742" strokeWidth="3" />
      <text
        x="320"
        y="212"
        textAnchor="middle"
        fontFamily="Archivo Narrow, Arial Narrow, sans-serif"
        fontSize="112"
        fill="#FFCE00"
        letterSpacing="4"
      >
        {RUSH_SECONDS}
        <animate attributeName="opacity" values="1;.5;1" dur="3s" repeatCount="indefinite" />
      </text>

      <rect x="180" y="286" width="280" height="14" rx="2" fill="#0C1013" stroke="#2C3742" />
      <rect x="182" y="288" height="10" rx="2" fill="#3DE08D">
        <animate attributeName="width" values="276;0" dur="6s" repeatCount="indefinite" />
      </rect>

      <g fill="#2C3742">
        <path d="M42 150 l38 24 l-38 24 z" />
        <path d="M96 150 l38 24 l-38 24 z" />
        <path d="M598 150 l-38 24 l38 24 z" />
        <path d="M544 150 l-38 24 l38 24 z" />
      </g>
    </svg>
  )
}

/** Placeholder for scenarios still in development: hazard stripes. */
export function SoonScene() {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="640" height="400" fill="#1B222A" />
      <g stroke="#2C3742" strokeWidth="26">
        <line x1="-40" y1="440" x2="440" y2="-40" />
        <line x1="120" y1="440" x2="600" y2="-40" />
        <line x1="280" y1="440" x2="760" y2="-40" />
      </g>
    </svg>
  )
}

/** Head to head: two arrival boards facing each other across a VS. */
export function DuelScene() {
  return (
    <svg viewBox="0 0 640 400" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="640" height="400" fill="#1B222A" />

      {[0, 1].map((side) => {
        const x = side === 0 ? 44 : 356
        const fill = side === 0 ? '#FFCE00' : '#35D6F5'
        return (
          <g key={side}>
            <rect x={x} y="104" width="240" height="150" rx="6" fill="#0C1013" stroke="#2C3742" strokeWidth="2" />
            <line x1={x} y1="164" x2={x + 240} y2="164" stroke="#2C3742" strokeWidth="3" />
            <rect x={x + 24} y="188" width="112" height="14" rx="2" fill={fill} opacity=".8" />
            <rect x={x + 24} y="214" width="72" height="14" rx="2" fill={fill} opacity=".35" />
            <circle cx={x + 200} cy="134" r="11" fill={fill}>
              <animate
                attributeName="opacity"
                values="1;.3;1"
                dur="2.2s"
                begin={`${side * 1.1}s`}
                repeatCount="indefinite"
              />
            </circle>
          </g>
        )
      })}

      <text
        x="320"
        y="196"
        textAnchor="middle"
        fontFamily="Archivo Narrow, Arial Narrow, sans-serif"
        fontSize="52"
        fill="#E8EDF2"
        letterSpacing="2"
      >
        VS
      </text>

      <g fill="#2C3742">
        <path d="M232 300 l34 22 l-34 22 z" />
        <path d="M408 300 l-34 22 l34 22 z" />
      </g>
    </svg>
  )
}
