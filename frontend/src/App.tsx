import { Routes, Route, useLocation } from 'react-router-dom'
import { Header } from '@/components/Header'
import { WelcomeScreen } from '@/pages/WelcomeScreen'
import { FormScreen } from '@/pages/FormScreen'
import { ResultScreen } from '@/pages/ResultScreen'

function App() {
  const location = useLocation()
  const isWelcomePage = location.pathname === '/'

  return (
    <div className="min-h-screen bg-background">
      {!isWelcomePage && <Header />}
      <Routes>
        <Route path="/" element={<WelcomeScreen />} />
        <Route path="/form" element={<FormScreen />} />
        <Route path="/result" element={<ResultScreen />} />
      </Routes>
    </div>
  )
}

export default App
