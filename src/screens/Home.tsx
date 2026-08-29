import { Link } from 'react-router-dom'
import { SCENARIO_LIST } from '../content/scenarios'
import { useProgress } from '../progress/useProgress'
import { Footer } from '../ui/Footer'
import { TopBar } from '../ui/TopBar'

export function Home() {
  return (
    <div className="home">
      <TopBar />
      <Hero />
      <LearnCard />
      <Footer />
    </div>
  )
}

function Hero() {
  const { isUnlocked } = useProgress()
  // The CTA and the caption both point at wherever the player actually is.
  const next = SCENARIO_LIST.find((s) => isUnlocked(s.id)) ?? SCENARIO_LIST[0]

  return (
    <section className="hero2">
      <div>
        <h1 className="bigline">
          Learn to Sign
          <br />
          <span className="hl">by Playing.</span>
        </h1>
        <p className="lede">
          Master essential hand shapes and everyday signs through interactive, scenario-based
          challenges.
        </p>
        <Link className="btn btn-primary" to={`/scenario/${next.id}`}>
          Let's Play
        </Link>
      </div>

      <div>
        <img
          className="heroshot"
          src="/signing.jpg"
          width={1400}
          height={933}
          alt="A woman and a young girl signing to each other across a table"
        />
      </div>
    </section>
  )
}

/** One door into everything: the scenarios and the games both live behind it. */
function LearnCard() {
  const { isUnlocked } = useProgress()
  const open = SCENARIO_LIST.filter((scenario) => isUnlocked(scenario.id)).length
  const progress = Math.round((open / SCENARIO_LIST.length) * 100)
  const action = open > 1 ? 'Continue learning' : 'Start learning'

  return (
    <section className="catsection" aria-labelledby="learn-heading">
      <Link className="bigcat" to="/learn" aria-labelledby="learn-heading">
        <div className="art">
          <img
            src="/learn-signing.png"
            width={1740}
            height={1160}
            alt="A woman and a child signing together at a playground"
          />
        </div>
        <div className="body">
          <p className="eyebrow">Start here</p>
          <h2 id="learn-heading">Learn by doing</h2>
          <p className="blurb">
            Build six essential hand shapes through quick scenarios and games, then practise them
            in the places you'd actually use them.
          </p>

          <ul className="learnstats" aria-label="Learning content">
            <li>
              <strong>{SCENARIO_LIST.length}</strong>
              <span>Scenarios</span>
            </li>
            <li>
              <strong>2</strong>
              <span>Games</span>
            </li>
            <li>
              <strong>6</strong>
              <span>Hand shapes</span>
            </li>
          </ul>

          <div className="learnprogress">
            <div className="progresscopy">
              <span>Scenario access</span>
              <strong>
                {open} of {SCENARIO_LIST.length} unlocked
              </strong>
            </div>
            <div
              className="progressbar"
              role="progressbar"
              aria-label="Scenarios unlocked"
              aria-valuemin={0}
              aria-valuemax={SCENARIO_LIST.length}
              aria-valuenow={open}
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          </div>

          <span className="learncta">{action}</span>
        </div>
      </Link>
    </section>
  )
}
