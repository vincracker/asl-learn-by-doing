import { Route, Routes } from 'react-router-dom'
import { Home } from './screens/Home'
import { Learn } from './screens/Learn'
import { About } from './screens/About'
import { ScenarioGame } from './screens/ScenarioGame'
import { RushHour } from './screens/RushHour'
import { RushDuel } from './screens/RushDuel'
import { AiGuess } from './screens/AiGuess'
import { ScrollToTop } from './ui/ScrollToTop'

export default function App() {
  return (
    <div id="app">
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/about" element={<About />} />
        <Route path="/scenario/:scenarioId" element={<ScenarioGame />} />
        <Route path="/rush" element={<RushHour />} />
        <Route path="/rush/duel" element={<RushDuel />} />
        <Route path="/guess" element={<AiGuess />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  )
}
