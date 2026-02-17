import { Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/useStore'
import Home from './pages/Home'

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </StoreProvider>
  )
}
