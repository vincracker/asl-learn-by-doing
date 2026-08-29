import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

/** The step pips along the top of a scenario. */
export function StepPips({ total, current }: { total: number; current: number }) {
  return (
    <div className="steps">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`pip${i < current ? ' past' : i === current ? ' on' : ''}`} />
      ))}
    </div>
  )
}

/** Frame shared by every playable screen: back link, title, optional pips. */
export function GameShell({
  title,
  sub,
  pips,
  children,
}: {
  title: string
  sub: string
  pips?: ReactNode
  children: ReactNode
}) {
  return (
    <div className="game">
      <div className="gamebar">
        <Link className="back" to="/">
          ← All games
        </Link>
        <h2>
          {title} <span className="dim">· {sub}</span>
        </h2>
        {pips}
      </div>
      {children}
    </div>
  )
}
