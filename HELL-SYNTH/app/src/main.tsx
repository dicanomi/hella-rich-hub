import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'

// HashRouter: the app ships as static files on hosts with NO SPA fallback, so
// path-based deep links (e.g. /instrument) hard-404 at the server. Hash URLs
// (/#/instrument?preset=x) never hit the server for subpaths — 404s are
// impossible on any static host. Links/navigate/searchParams work unchanged.
createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <App />
  </HashRouter>,
)
