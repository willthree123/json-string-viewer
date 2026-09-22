import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import './index.css'
import App from './App.tsx'
import JsonScanPage from './JsonScanPage.tsx'
import SqlPage from './SqlPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroUIProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/sql" element={<SqlPage />} />
          <Route path="/scan-json" element={<JsonScanPage />} />
        </Routes>
      </HashRouter>
    </HeroUIProvider>
  </StrictMode>,
)
