import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Bridge from './pages/Bridge'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/bridge/:code" element={<Bridge />} />
    </Routes>
  )
}
