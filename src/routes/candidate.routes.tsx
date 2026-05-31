import { Route } from "react-router-dom";

import RequireAuth from "../guards/RequireAuth";
import RequireVariant from "../guards/RequireVariant";

import DashboardCandidateScreen from "../pages/candidate/DashboardCandidateScreen";
import MyApplicationScreen from "../pages/candidate/MyApplicationScreen";
import CandidateProfileAndCVManagementScreen from "../pages/candidate/CandidateProfileAndCVManagementScreen";
import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";

const candidateRoutes = (
  <Route element={<RequireAuth />}>
    <Route element={<AuthenticatedLayout />}>
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
          path="/candidate/profile/*"
          element={<CandidateProfileAndCVManagementScreen />}
        />
      </Route>
    </Route>
  </Route>
);

export default candidateRoutes;