import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Quiz from './pages/Quiz'
import Results from './pages/Results'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz/:examType" element={<Quiz />} />
          <Route path="/practice/:examType" element={<Quiz />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App