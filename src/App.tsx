import { Navigate, Route, Routes } from 'react-router-dom'
import CandidateLandingPage from './pages/candidate/LandingPageScreen'
import CandidateLoginScreen from './pages/candidate/CandidateLoginScreen'
import CandidateRegisterScreen from './pages/candidate/CandidateRegisterScreen'
import MyApplicationScreen from './pages/candidate/MyApplicationScreen'
import CandidateProfileAndCVManagementScreen from './pages/candidate/CandidateProfileAndCVManagementScreen'
import InternalLoginScreen from './pages/internal/InternalLoginScreen'
import JobListingCandidateScreen from './pages/internal/JobListingCandidateScreen'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/candidate" replace />} />

      {/* Candidate */}
      <Route path="/candidate" element={<CandidateLandingPage />} />
      <Route path="/candidate/login" element={<CandidateLoginScreen />} />
      <Route path="/candidate/register" element={<CandidateRegisterScreen />} />
      <Route path="/candidate/my-applications" element={<MyApplicationScreen />} />
      <Route path="/candidate/applications" element={<MyApplicationScreen />} />
      <Route path="/candidate/jobs" element={<Navigate to="/candidate" replace />} />
      <Route path="/candidate/profile" element={<CandidateProfileAndCVManagementScreen />} />
      <Route path="/candidate/profile/*" element={<CandidateProfileAndCVManagementScreen />} />

      {/* Internal (HR / Manager / System Admin) */}
      <Route path="/internal" element={<Navigate to="/internal/login" replace />} />
      <Route path="/internal/dashboard" element={<Navigate to="/internal/jobs" replace />} />
      <Route
        path="/internal/applications"
        element={<Navigate to="/internal/candidate-profile" replace />}
      />
      <Route path="/internal/analytics" element={<Navigate to="/internal/jobs" replace />} />
      <Route path="/internal/settings" element={<Navigate to="/internal/candidate-profile" replace />} />
      <Route path="/internal/support" element={<Navigate to="/internal/login" replace />} />
      <Route path="/internal/login" element={<InternalLoginScreen />} />
      <Route path="/internal/jobs" element={<JobListingCandidateScreen />} />
      <Route path="/internal/candidate-profile" element={<Navigate to="/candidate/profile" replace />} />
    </Routes>
  )
}

export default App
