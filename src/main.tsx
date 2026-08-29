import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { DetectorProvider } from './vision/DetectorProvider'
import { ProgressProvider } from './progress/ProgressProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DetectorProvider>
        <ProgressProvider>
          <App />
        </ProgressProvider>
      </DetectorProvider>
    </BrowserRouter>
  </StrictMode>,
)
