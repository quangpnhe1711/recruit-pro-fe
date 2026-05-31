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
import CandidateListScreen from "./pages/hr/CandidateListScreen";
import CandidateApplicationScreen from "./pages/hr/CandidateApplicationScreen";
import JobsRouteScreen from "./pages/JobsRouteScreen";
import { ToastContainer } from "react-toastify";
import { Provider, useSelector } from "react-redux";
import { RootState, store } from "./store";
import AuthenticatedLayout from "./common/components/layout/AuthenticatedLayout";
import LogoutScreen from "./pages/LogoutScreen";
import PublicOnly from "./common/app-common-layout/PublicOnly";
import RequireAuth from "./common/app-common-layout/RequireAuth";
import RequireVariant from "./common/app-common-layout/RequireVariant";
import PublicLayout from "./common/components/layout/PublicLayout";

function App() {
    const isAuthenticated = useSelector(
      (state: RootState) => state.auth.isAuthenticated,
    );
  return (
    <>
      <Provider store={store}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />

          {/* Public */}
          <Route element={<PublicLayout />}>
            <Route path="/home" element={<CandidateLandingPage />} />
            {!isAuthenticated && (<Route path="/home" element={<Navigate to="/jobs" replace />} />)}
          </Route>

          <Route element={<PublicOnly />}>
            <Route path="/login" element={<CandidateLoginScreen />} />
            <Route
              path="/candidate/register"
              element={<CandidateRegisterScreen />}
            />
            <Route path="/internal/login" element={<InternalLoginScreen />} />
          </Route>

          {/* Authenticated */}
          <Route element={<RequireAuth />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/logout" element={<LogoutScreen />} />

              {/* Shared (any authenticated variant) */}
              <Route path="/jobs" element={<JobsRouteScreen />} />
              <Route
                path="/candidate/jobs"
                element={<Navigate to="/jobs" replace />}
              />
              <Route
                path="/internal/jobs"
                element={<Navigate to="/jobs" replace />}
              />

              {isAuthenticated && (<Route path="/home" element={<Navigate to="/jobs" replace />} />)}

              {/* Candidate */}
              <Route element={<RequireVariant variant="candidate" />}>
                <Route
                  path="/candidate/dashboard"
                  element={<DashboardCandidateScreen />}
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
                  path="/candidate/profile/*"
                  element={<CandidateProfileAndCVManagementScreen />}
                />
              </Route>

              {/* Internal (HR / Manager / System Admin) */}
              <Route element={<RequireVariant variant="internal" />}>
                <Route
                  path="/internal/dashboard"
                  element={<HrDashboardScreen />}
                />
                <Route
                  path="/internal/jobs/create"
                  element={<JobCreatingScreen />}
                />
                <Route
                  path="/internal/candidates"
                  element={<CandidateListScreen />}
                />
                <Route
                  path="/internal/candidates/list"
                  element={<CandidateListScreen />}
                />
                <Route
                  path="/internal/applications"
                  element={<CandidateApplicationScreen />}
                />
                <Route
                  path="/internal/applications/list"
                  element={<CandidateApplicationScreen />}
                />
                <Route
                  path="/internal/interviews"
                  element={<JobInterviewListScreen />}
                />
                <Route
                  path="/internal/interviews/list"
                  element={<JobInterviewListScreen />}
                />
                <Route
                  path="/internal/interviews/schedule"
                  element={<InterviewScheduleScreen />}
                />
                <Route
                  path="/internal/interview-schedule"
                  element={<InterviewScheduleScreen />}
                />

                <Route
                  path="/internal/settings"
                  element={<Navigate to="/internal/dashboard" replace />}
                />
                <Route
                  path="/internal/support"
                  element={<Navigate to="/internal/dashboard" replace />}
                />
              </Route>
            </Route>
          </Route>

          <Route
            path="/internal"
            element={<Navigate to="/internal/login" replace />}
          />
          <Route path="*" element={<Navigate to="/home" replace />} />
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
