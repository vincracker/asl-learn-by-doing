import { NavLink, Route, Routes } from 'react-router-dom'
import { Home } from './game/Home'
import { LearnMimic } from './game/LearnMimic'
import { ScenarioGame } from './game/ScenarioGame'
import { Author } from './author/Author'
import { SCENARIOS } from './scenarios'

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__brand">
          <strong>Signpost</strong>
          <span>practise everyday ASL</span>
        </div>
        <nav className="nav">
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
          <Route path="*" element={<p className="muted">Nothing here.</p>} />
        </Routes>
      </main>
    </div>
  )
}

const navClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'is-active' : '')
