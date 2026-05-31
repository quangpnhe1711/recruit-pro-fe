import { Route } from "react-router-dom";

import RequireAuth from "../guards/RequireAuth";
import RequireVariant from "../guards/RequireVariant";

import HrDashboardScreen from "../pages/hr/HrDashboardScreen";
import CandidateListScreen from "../pages/hr/CandidateListScreen";
import CandidateApplicationScreen from "../pages/hr/CandidateApplicationScreen";
import JobCreatingScreen from "../pages/hr/JobCreatingScreen";
import JobInterviewListScreen from "../pages/hr/JobInterviewListScreen";
import InterviewScheduleScreen from "../pages/hr/InterviewScheduleScreen";
import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";

const hrRoutes = (
  <Route element={<RequireAuth />}>
    <Route element={<AuthenticatedLayout />}>
      <Route element={<RequireVariant variant="hr" />}>
        <Route
          path="/hr/dashboard"
          element={<HrDashboardScreen />}
        />

        <Route
          path="/hr/jobs/create"
          element={<JobCreatingScreen />}
        />

        <Route
          path="/hr/candidates"
          element={<CandidateListScreen />}
        />

        <Route
          path="/hr/applications"
          element={<CandidateApplicationScreen />}
        />

        <Route
          path="/hr/interviews"
          element={<JobInterviewListScreen />}
        />

        <Route
          path="/hr/interviews/schedule"
          element={<InterviewScheduleScreen />}
        />
      </Route>
    </Route>
  </Route>
);

export default hrRoutes;