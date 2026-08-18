import { Routes, Route } from 'react-router'
import Layout from '@/components/Layout'
import Home from '@/pages/Home'
import Instrument from '@/pages/Instrument'
import Guide from '@/pages/Guide'

export default function App() {
  return (
    <Routes>
      {/* Landing-family pages share Nav + Footer (Layout renders <Outlet/>) */}
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="guide" element={<Guide />} />
      </Route>
      {/* The instrument is a full-viewport app with its own TopBar — no landing chrome */}
      <Route path="instrument" element={<Instrument />} />
    </Routes>
  )
}
