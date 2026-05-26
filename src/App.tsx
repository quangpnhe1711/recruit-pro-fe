import { Navigate, Route, Routes } from "react-router-dom";
import CandidateLandingPage from "./pages/candidate/LandingPageScreen";
import CandidateLoginScreen from "./pages/candidate/CandidateLoginScreen";
import CandidateRegisterScreen from "./pages/candidate/CandidateRegisterScreen";
import MyApplicationScreen from "./pages/candidate/MyApplicationScreen";
import CandidateProfileAndCVManagementScreen from "./pages/candidate/CandidateProfileAndCVManagementScreen";
import DashboardCandidateScreen from "./pages/candidate/DashboardCandidateScreen";
import InternalLoginScreen from "./pages/internal/InternalLoginScreen";
import HrDashboardScreen from "./pages/hr/HrDashboardScreen";
import InterviewScheduleScreen from "./pages/hr/InterviewScheduleScreen";
import JobInterviewListScreen from "./pages/hr/JobInterviewListScreen";
import JobCreatingScreen from "./pages/hr/JobCreatingScreen";
import JobsRouteScreen from "./pages/JobsRouteScreen";
import { ToastContainer } from "react-toastify";
import { Provider } from "react-redux";
import { store } from "./store";

function App() {
  return (
    <>
      <Provider store={store}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Candidate */}
          <Route path="/home" element={<CandidateLandingPage />} />
          <Route
            path="/candidate/dashboard"
            element={<DashboardCandidateScreen />}
          />
          <Route path="/candidate/login" element={<CandidateLoginScreen />} />
          <Route
            path="/candidate/register"
            element={<CandidateRegisterScreen />}
          />
          <Route
            path="/candidate/my-applications"
            element={<MyApplicationScreen />}
          />
          <Route
            path="/candidate/applications"
            element={<MyApplicationScreen />}
          />
          <Route
            path="/candidate/jobs"
            element={<Navigate to="/jobs" replace />}
          />
          <Route
            path="/candidate/profile"
            element={<CandidateProfileAndCVManagementScreen />}
          />
          <Route
            path="/candidate/profile/*"
            element={<CandidateProfileAndCVManagementScreen />}
          />

          {/* Internal (HR / Manager / System Admin) */}
          <Route
            path="/internal"
            element={<Navigate to="/internal/login" replace />}
          />
          <Route path="/internal/dashboard" element={<HrDashboardScreen />} />
          <Route path="/internal/jobs/create" element={<JobCreatingScreen />} />
          <Route path="/internal/interviews" element={<JobInterviewListScreen />} />
          <Route path="/internal/interviews/list" element={<JobInterviewListScreen />} />
          <Route
            path="/internal/interviews/schedule"
            element={<InterviewScheduleScreen />}
          />
          <Route
            path="/internal/interview-schedule"
            element={<InterviewScheduleScreen />}
          />

          <Route
            path="/internal/applications"
            element={<Navigate to="/internal/candidate-profile" replace />}
          />
          <Route
            path="/internal/settings"
            element={<Navigate to="/internal/candidate-profile" replace />}
          />
          <Route
            path="/internal/support"
            element={<Navigate to="/internal/login" replace />}
          />
          <Route path="/internal/login" element={<InternalLoginScreen />} />
          <Route path="/jobs" element={<JobsRouteScreen />} />
          <Route path="/internal/jobs" element={<Navigate to="/jobs" replace />} />
          <Route
            path="/internal/candidate-profile"
            element={<Navigate to="/candidate/profile" replace />}
          />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          style={{ top: "70px" }}
        />
      </Provider>
    </>
  );
}

export default App;
