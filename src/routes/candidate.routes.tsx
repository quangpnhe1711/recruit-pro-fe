import { Route } from "react-router-dom";

import RequireAuth from "../guards/RequireAuth";
import RouteGuard from "../guards/RouteGuard";
import { PERMISSIONS } from "../permissions/permissions";

import DashboardCandidateScreen from "../pages/candidate/DashboardCandidateScreen";
import MyApplicationScreen from "../pages/candidate/MyApplicationScreen";
import CandidateProfileAndCVManagementScreen from "../pages/candidate/candidate-profile-screen/CandidateProfileAndCVManagementScreen";
import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";
import CandidateInterviewScreen from "../pages/candidate/CandidateInterviewScreen";
import ApplyJobScreen from "../pages/candidate/ApplyJobScreen";

const candidateRoutes = (
  <Route element={<RequireAuth />}>
    <Route element={<AuthenticatedLayout />}>
      <Route
        element={<RouteGuard permissions={PERMISSIONS.DASHBOARD_VIEW_OWN} />}
      >
        <Route
          path="/candidate/dashboard"
          element={<DashboardCandidateScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.APPLICATION_VIEW_OWN} />}
      >
        <Route path="/jobs/:jobId/apply" element={<ApplyJobScreen />} />

        <Route
          path="/candidate/my-applications"
          element={<MyApplicationScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.INTERVIEW_VIEW_OWN} />}
      >
        <Route
          path="/candidate/interviews"
          element={<CandidateInterviewScreen />}
        />
      </Route>

      <Route
        element={
          <RouteGuard permissions={PERMISSIONS.CANDIDATE_VIEW_OWN_PROFILE} />
        }
      >
        <Route
          path="/candidate/profile/*"
          element={<CandidateProfileAndCVManagementScreen />}
        />
      </Route>
    </Route>
  </Route>
);

export default candidateRoutes;
