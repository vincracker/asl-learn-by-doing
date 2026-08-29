import { Link } from 'react-router-dom'
import { GESTURES } from '../content/gestures'
import { SCENARIO_LIST } from '../content/scenarios'
import { BONUS } from '../content/bonus'
import { Footer } from '../ui/Footer'
import { TopBar } from '../ui/TopBar'

export function About() {
  const stats = [
    { num: String(Object.keys(GESTURES).length), lab: 'Hand shapes' },
    { num: String(SCENARIO_LIST.length), lab: 'Scenarios' },
    { num: String(BONUS.filter((game) => game.path).length), lab: 'Bonus games' },
    { num: '0', lab: 'Accounts needed' },
  ]

  return (
    <div className="home">
      <TopBar />

      <header className="pagehead">
        <h1>About us</h1>
        <p className="lede">
          HandsUp is a browser game for learning simple hand signs, played in the places you'd
          actually need them. Your webcam watches your hand and scores how close the shape was.
        </p>
      </header>

      <div className="statrow">
        {stats.map((stat) => (
          <div key={stat.lab} className="stat">
            <p className="num">{stat.num}</p>
            <p className="lab">{stat.lab}</p>
          </div>
        ))}
      </div>

      <div className="aboutgrid">
        <article className="aboutcard">
          <span className="bar" />
          <h2>Why it exists</h2>
          <p>
            Deaf people learn our languages every day. This flips the direction for once: three
            signs per scenario, in a check-in queue and at a bus door, so the first thing you learn
            is the thing you'd actually use.
          </p>
        </article>

        <article className="aboutcard">
          <span className="bar" />
          <h2>How it reads your hand</h2>
          <p>
            Google's MediaPipe Gesture Recognizer runs entirely in your browser. Every frame is
            scored twice — once by the pretrained classifier, once by the geometry of the 21
            landmarks — and the stronger reading wins. Scores are an 800 ms rolling mean, so a
            steady hold counts and a lucky frame doesn't.
          </p>
        </article>

        <article className="aboutcard">
          <span className="bar" />
          <h2>Nothing leaves your device</h2>
          <p>
            No account, no download, no upload. Frames are read and discarded, and after the first
            load the app needs no network at all. Progress lives in this tab only — refresh and you
            start clean.
          </p>
        </article>

        <article className="aboutcard">
          <span className="bar" />
          <h2>No camera, no problem</h2>
          <p>
            If the model fails to load or the camera is refused, every mode falls back to practice
            mode: keys 1–6 each stand in for one hand shape, so the whole app stays playable.
          </p>
        </article>
      </div>

      <aside className="callout">
        <h2>
          Play. Practice. <span className="hl">Sign.</span>
        </h2>
        <p>
          Build real-world signing skills through quick, interactive challenges designed around
          everyday situations.
        </p>
      </aside>

      <div className="aboutcta">
        <Link className="btn btn-primary" to="/learn">
          Start Learning
        </Link>
      </div>

      <Footer />
    </div>
  )
}
