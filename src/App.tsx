import { Route, Routes } from 'react-router-dom'
import { Home } from './screens/Home'
import { ScenarioGame } from './screens/ScenarioGame'
import { RushHour } from './screens/RushHour'
import { AiGuess } from './screens/AiGuess'
import { SixSeven } from './screens/SixSeven'

export default function App() {
  return (
    <div id="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/scenario/:scenarioId" element={<ScenarioGame />} />
        <Route path="/rush" element={<RushHour />} />
        <Route path="/guess" element={<AiGuess />} />
        <Route path="/six-seven" element={<SixSeven />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  )
}
