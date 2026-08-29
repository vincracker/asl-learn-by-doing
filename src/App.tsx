import { NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './game/Home'
import { LearnMimic } from './game/LearnMimic'
import { ScenarioGame } from './game/ScenarioGame'
import { Author } from './author/Author'
import { SCENARIOS } from './scenarios'

export default function App() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-6 pt-7 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-baseline gap-2.5">
          <strong className="text-xl">Signpost</strong>
          <span className="text-sm opacity-60">practise everyday ASL</span>
        </div>
        <nav className="flex flex-wrap gap-2">
          <NavLink to="/" end className={navClass}>Home</NavLink>
          {SCENARIOS.map((s) => (
            <NavLink key={s.id} to={`/scenario/${s.id}`} className={navClass}>
              {s.title}
            </NavLink>
          ))}
          {import.meta.env.DEV && <NavLink to="/author" className={navClass}>Author</NavLink>}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice/:signId" element={<LearnMimic />} />
          <Route path="/scenario/:scenarioId" element={<ScenarioGame />} />
          {import.meta.env.DEV && <Route path="/author" element={<Author />} />}
          <Route path="*" element={<p className="opacity-60">Nothing here.</p>} />
        </Routes>
      </main>
    </div>
  )
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `btn btn-sm rounded-selector ${isActive ? 'btn-primary' : 'btn-ghost'}`
