import { Routes, Route } from 'react-router-dom'
import { Header } from '@/components/Header'
import { FormScreen } from '@/pages/FormScreen'
import { ResultScreen } from '@/pages/ResultScreen'

function App() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Routes>
        <Route path="/" element={<FormScreen />} />
        <Route path="/result" element={<ResultScreen />} />
      </Routes>
    </div>
  )
}

export default App
