import { Navigate, Route, Routes } from 'react-router-dom'
import CandidateLandingPage from './pages/candidate/LandingPageScreen'
import CandidateLoginScreen from './pages/candidate/CandidateLoginScreen'
import CandidateRegisterScreen from './pages/candidate/CandidateRegisterScreen'
import InternalLoginScreen from './pages/internal/InternalLoginScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/candidate" replace />} />

      {/* Candidate */}
      <Route path="/candidate" element={<CandidateLandingPage />} />
      <Route path="/candidate/login" element={<CandidateLoginScreen />} />
      <Route path="/candidate/register" element={<CandidateRegisterScreen />} />

      {/* Internal (HR / Manager / System Admin) */}
      <Route path="/internal" element={<Navigate to="/internal/login" replace />} />
      <Route path="/internal/login" element={<InternalLoginScreen />} />
    </Routes>
  )
}

export default App
