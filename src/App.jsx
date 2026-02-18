import { Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/useStore'
import Home from './pages/Home'
import Footer from './components/Footer'

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
      <Footer />
    </StoreProvider>
  )
}
