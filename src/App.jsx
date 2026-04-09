import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import ExamSelect from './pages/ExamSelect'
import Quiz from './pages/Quiz'
import Rapid from './pages/Rapid'
import Results from './pages/Results'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-da-bg flex flex-col">
      <div className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/exam/:examType" element={<ExamSelect />} />
          <Route path="/quiz/:examType" element={<Quiz />} />
          <Route path="/practice/:examType" element={<Quiz />} />
          <Route path="/rapid/:examType" element={<Rapid />} />
          <Route path="/results" element={<Results />} />
        </Routes>
      </div>
      <Footer />
    </div>
  )
}

export default App