import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import ExamSelect from './pages/ExamSelect'
import Quiz from './pages/Quiz'
import Rapid from './pages/Rapid'
import Results from './pages/Results'
import Login from './pages/Login'
import AuthCallback from './pages/AuthCallback'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-da-bg flex flex-col">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/exam/:examType" element={<ExamSelect />} />
            <Route path="/quiz/:examType" element={<Quiz />} />
            <Route path="/practice/:examType" element={<Quiz />} />
            <Route path="/rapid/:examType" element={<Rapid />} />
            <Route path="/results" element={<Results />} />
            <Route path="/login" element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App