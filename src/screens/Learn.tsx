import { Link } from 'react-router-dom'
import { BONUS } from '../content/bonus'
import { PASS } from '../content/rules'
import { ORDER, SCENARIOS, SCENARIO_LIST, type Scenario } from '../content/scenarios'
import { useProgress } from '../progress/useProgress'
import { CategoryArt, type CategoryArtId } from '../ui/CategoryArt'
import { Footer } from '../ui/Footer'
import { TopBar } from '../ui/TopBar'

export function Learn() {
  // Only the built games; the rest of BONUS is roadmap.
  const games = BONUS.filter((game) => game.path)

  return (
    <div className="home">
      <TopBar />

      <header className="pagehead">
        <h1>Learn</h1>
        <p className="lede">
          Six hand shapes, three signs per scenario, played where you'd actually need them. Clear a
          scenario at {Math.round(PASS * 100)}% and the next one opens.
        </p>
      </header>

      <section className="learnsec">
        <h2 className="sectitle">Scenarios</h2>
        <div className="scenlist">
          {SCENARIO_LIST.map((scenario) => (
            <ScenarioCard key={scenario.id} scenario={scenario} />
          ))}
        </div>
      </section>

      <section className="learnsec">
        <h2 className="sectitle">Games</h2>
        <div className="scenlist">
          {games.map((game) => (
            <Link key={game.id} className="scen" to={game.path as string}>
              <div className="art">
                <CategoryArt id={game.art as CategoryArtId} />
              </div>
              <div className="body">
                <h2>{game.name}</h2>
                <p className="tagline">No scenario, no gate</p>
                <p className="blurb">{game.blurb}</p>
                <div className="words">
                  {game.chips.map((chip) => (
                    <span key={chip} className="chip">
                      {chip}
                    </span>
                  ))}
                </div>
                <p className="state">Always open</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const { getScore, isUnlocked } = useProgress()
  const unlocked = isUnlocked(scenario.id)
  const score = getScore(scenario.id)

  const inner = (
    <>
      <div className="art">
        <CategoryArt id={scenario.id as CategoryArtId} />
      </div>
      <div className="body">
        <h2>{scenario.name}</h2>
        <p className="tagline">{scenario.tagline}</p>
        <p className="blurb">{scenario.blurb}</p>
        <div className="words">
          {scenario.words.map((word) => (
            <span key={word} className="chip">
              {word}
            </span>
          ))}
        </div>
        <p className="state">{stateLine(scenario, unlocked, score)}</p>
      </div>
    </>
  )

  return unlocked ? (
    <Link className="scen" to={`/scenario/${scenario.id}`}>
      {inner}
    </Link>
  ) : (
    <div className="scen locked" aria-disabled="true">
      {inner}
    </div>
  )
}

function stateLine(scenario: Scenario, unlocked: boolean, score: number | null) {
  if (!unlocked) {
    const previous = SCENARIOS[ORDER[ORDER.indexOf(scenario.id) - 1]]
    return `Locked · clear ${previous.name} at ${Math.round(PASS * 100)}%`
  }
  if (score === null) return 'Not played yet'
  return `Best ${Math.round(score * 100)}%`
}
