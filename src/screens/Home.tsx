import { BONUS } from '../content/bonus'
import { PASS } from '../content/rules'
import { ORDER, SCENARIOS, SCENARIO_LIST, SOON, type Scenario } from '../content/scenarios'
import { useProgress } from '../progress/useProgress'
import { LinkCard, LockedCard, Tag } from '../ui/Cards'
import { SplitFlap } from '../ui/SplitFlap'
import { useDetector } from '../vision/useDetector'

export function Home() {
  return (
    <section>
      <Hero />

      <Rail title="Scenarios" hint="Scroll sideways →">
        {SCENARIO_LIST.map((s) => (
          <ScenarioCard key={s.id} scenario={s} />
        ))}
        {SOON.map((s) => (
          <LockedCard
            key={s.name}
            art="soon"
            tag={<Tag kind="locked">In development</Tag>}
            name={s.name}
            desc={s.tagline}
            chips={['3 signs']}
          />
        ))}
      </Rail>

      <Rail title="Bonus games" hint="No scenario, no gate">
        {BONUS.map((b) =>
          b.path ? (
            <LinkCard
              key={b.id}
              to={b.path}
              art={b.art}
              tag={<Tag kind="open">Always open</Tag>}
              name={b.name}
              desc={b.blurb}
              chips={b.chips}
            />
          ) : (
            <LockedCard
              key={b.id}
              art={b.art}
              tag={<Tag kind="locked">Coming soon</Tag>}
              name={b.name}
              desc={b.blurb}
              chips={b.chips}
            />
          ),
        )}
      </Rail>

      <Notes />
    </section>
  )
}

function Hero() {
  const { status, message } = useDetector()
  const dotClass = status === 'ready' ? 'dot live' : status === 'error' ? 'dot off' : 'dot'

  return (
    <header className="hero">
      <p className="eyebrow">Two-way, not one-way</p>
      <SplitFlap word="SIGNPORT" />
      <p className="lede">
        Deaf people learn our languages every day. <b>This flips it.</b> Three signs per scenario,
        played in the places you actually need them — a check-in desk, a bus door. No account, no
        download, just your camera.
      </p>

      <div className="statusbar" role="status">
        <span className={dotClass} />
        <span>{message}</span>
        <span className="dim" style={{ marginLeft: 'auto' }}>
          Video never leaves your device
        </span>
      </div>
    </header>
  )
}

function Rail({
  title,
  hint,
  children,
}: {
  title: string
  hint: string
  children: React.ReactNode
}) {
  return (
    <div className="rail">
      <div className="rail-head">
        <h2>{title}</h2>
        <span className="hint">{hint}</span>
      </div>
      <div className="track">{children}</div>
    </div>
  )
}

function ScenarioCard({ scenario }: { scenario: Scenario }) {
  const { getScore, isUnlocked } = useProgress()
  const score = getScore(scenario.id)
  const unlocked = isUnlocked(scenario.id)
  const done = score !== null && score >= PASS

  const body = {
    art: scenario.id,
    name: scenario.name,
    desc: scenario.blurb,
    chips: scenario.words,
    extra: score !== null ? <p className="scoreline">Best {Math.round(score * 100)}%</p> : undefined,
  } as const

  if (!unlocked) {
    const previous = SCENARIOS[ORDER[ORDER.indexOf(scenario.id) - 1]]
    return (
      <LockedCard
        {...body}
        tag={<Tag kind="locked">Locked · need {Math.round(PASS * 100)}% in {previous.name}</Tag>}
      />
    )
  }

  return (
    <LinkCard
      {...body}
      to={`/scenario/${scenario.id}`}
      tag={<Tag kind={done ? 'done' : 'open'}>{done ? 'Cleared' : 'Open'}</Tag>}
    />
  )
}

function Notes() {
  return (
    <div className="notes">
      <div className="note">
        <b>How the gate works</b>Score {Math.round(PASS * 100)}% or higher and the next scenario
        opens. Below that, replay — repetition is the point, not the punishment.
      </div>
      <div className="note">
        <b>What's under the hood</b>Google MediaPipe{' '}
        <a href="https://github.com/google-ai-edge/mediapipe" target="_blank" rel="noopener noreferrer">
          Gesture Recognizer
        </a>
        , a pretrained model that runs entirely in your browser. Frames are read and discarded.
      </div>
      <div className="note">
        <b>Honest limitation</b>These are simplified single-hand signs, not full ASL or Auslan —
        real signs use two hands, movement and face. Treat this as a first door, not a dictionary.
      </div>
      <div className="note">
        <b>Progress</b>Kept in this tab only, so nothing about you is stored. Refresh and you start
        clean.
      </div>
    </div>
  )
}
