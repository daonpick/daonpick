import { Routes, Route } from 'react-router-dom'
import { StoreProvider } from './store/useStore'
import Home from './pages/Home'
import TelegramEdit from './pages/TelegramEdit'
import TarotMiniApp from './pages/TarotMiniApp'
import Footer from './components/Footer'

export default function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/telegram-edit" element={<TelegramEdit />} />
        <Route path="/tarot" element={<TarotMiniApp />} />
      </Routes>
      <Footer />
    </StoreProvider>
  )
}
