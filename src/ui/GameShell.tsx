import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { TopBar } from './TopBar'

/** The step pips along the top of a scenario. */
export function StepPips({ total, current }: { total: number; current: number }) {
  return (
    <div className="pips" role="img" aria-label={`Sign ${current + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`pip${i < current ? ' past' : i === current ? ' on' : ''}`} />
      ))}
    </div>
  )
}

/**
 * Frame shared by every playable screen.
 *
 * It wears the same TopBar as the rest of the site — the old in-game switcher duplicated
 * what /learn already does, and gave these screens a second, conflicting nav.
 */
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
    <div className="home">
      <TopBar />
      <div className="gamebar">
        <Link className="back" to="/learn">
          ← All games
        </Link>
        <div className="titlerow">
          <h2>
            {title} <span className="dim">· {sub}</span>
          </h2>
          {pips}
        </div>
      </div>
      {children}
    </div>
  )
}
