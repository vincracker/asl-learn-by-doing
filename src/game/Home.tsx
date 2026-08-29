import { Link } from 'react-router-dom'
import { SCENARIOS } from '../scenarios'
import { allSigns } from '../signs/registry'
import { SignCard } from '../ui/SignCard'
import { Disclaimer } from '../ui/Disclaimer'

export function Home() {
  const signs = allSigns()
  const ready = signs.filter((s) => s.template).length

  return (
    <div className="stack" style={{ gap: 28 }}>
      <section className="panel stack">
        <h2>Learn ASL by doing it</h2>
        <p className="muted">
          Pick a scenario and hold a conversation in American Sign Language. Your camera
          watches your hands and tells you how close you got.
        </p>
        <Disclaimer />
      </section>

      <section className="stack">
        <h3>Scenarios</h3>
        <div className="grid">
          {SCENARIOS.map((s) => (
            <Link key={s.id} to={`/scenario/${s.id}`} className="sign-card">
              <span className="sign-card__gloss">{s.emoji} {s.title}</span>
              <span className="sign-card__how">{s.blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="stack">
        <div className="row" style={{ justifyContent: 'space-between' }}>
          <h3>Signs</h3>
          <span className="muted">{ready} of {signs.length} recorded</span>
        </div>
        <div className="grid">
          {signs.map((sign) => <SignCard key={sign.id} sign={sign} />)}
        </div>
      </section>
    </div>
  )
}
