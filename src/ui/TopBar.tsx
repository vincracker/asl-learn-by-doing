import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/learn', label: 'Learn' },
  { to: '/about', label: 'About us' },
]

/** Wordmark and the top-level nav, shared by every non-playing screen. */
export function TopBar() {
  const { pathname } = useLocation()

  return (
    <header className="topbar">
      <Link className="wordmark" to="/">
        HandsUp
      </Link>
      <nav className="topnav" aria-label="Main">
        {NAV.map((item) => {
          // Anything you're actually playing still belongs to Learn.
          const active =
            pathname === item.to ||
            (item.to === '/learn' &&
              (pathname.startsWith('/scenario/') || pathname === '/rush' || pathname === '/guess'))

          return (
            <Link
              key={item.to}
              to={item.to}
              className={active ? 'on' : undefined}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
