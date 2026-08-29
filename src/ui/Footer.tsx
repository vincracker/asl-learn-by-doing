import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="sitefooter">
      <div className="footertop">
        <div className="footerbrand">
          <p className="footereyebrow">Learn through play</p>
          <Link className="footerwordmark" to="/">
            HandsUp
          </Link>
          <p>Learn essential hand signs through play and real-world practice.</p>
        </div>

        <div className="footercta">
          <p className="footereyebrow">Your next step</p>
          <h2>Ready for your next sign?</h2>
          <Link className="footerbutton" to="/learn">
            Explore lessons
          </Link>
        </div>
      </div>

      <div className="footerbottom">
        <p>© Copyright 2026. HandsUp</p>
        <nav className="footernav" aria-label="Footer">
          <Link to="/">Home</Link>
          <Link to="/learn">Learn</Link>
          <Link to="/about">About us</Link>
        </nav>
      </div>
    </footer>
  )
}
