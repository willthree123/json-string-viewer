import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { HeroUIProvider } from '@heroui/react'
import './index.css'
import App from './App.tsx'
import SqlPage from './SqlPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeroUIProvider>
      <BrowserRouter basename="/json-string-viewer/">
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/sql" element={<SqlPage />} />
        </Routes>
      </BrowserRouter>
    </HeroUIProvider>
  </StrictMode>,
)
