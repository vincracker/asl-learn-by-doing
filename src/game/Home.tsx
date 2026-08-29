import { Link } from 'react-router-dom'
import { SCENARIOS } from '../scenarios'
import { allSigns } from '../signs/registry'
import { SignCard } from '../ui/SignCard'
import { Disclaimer } from '../ui/Disclaimer'

export function Home() {
  const signs = allSigns()
  const ready = signs.filter((s) => s.template).length

  return (
    <div className="flex flex-col gap-7">
      <section className="card border-2 border-base-300 bg-base-100">
        <div className="card-body gap-3">
          <h2 className="card-title text-2xl">Learn ASL by doing it</h2>
          <p className="leading-relaxed opacity-70">
            Pick a scenario and hold a conversation in American Sign Language. Your camera
            watches your hands and tells you how close you got.
          </p>
          <Disclaimer />
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg">Scenarios</h3>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5">
          {SCENARIOS.map((s) => (
            <Link
              key={s.id}
              to={`/scenario/${s.id}`}
              className="card border-2 border-base-300 bg-base-100 transition-colors hover:border-accent"
            >
              <div className="card-body items-start gap-2 p-4">
                <span className="text-lg font-bold">{s.emoji} {s.title}</span>
                <span className="text-sm leading-relaxed opacity-60">{s.blurb}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg">Signs</h3>
          <span className="text-sm opacity-60">{ready} of {signs.length} recorded</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3.5">
          {signs.map((sign) => <SignCard key={sign.id} sign={sign} />)}
        </div>
      </section>
    </div>
  )
}
