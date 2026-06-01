import { Route } from "react-router-dom";

import PublicOnly from "../guards/PublicOnly";

import CandidateLoginScreen from "../pages/public/CandidateLoginScreen";
import CandidateRegisterScreen from "../pages/public/CandidateRegisterScreen";
import InternalLoginScreen from "../pages/internal/InternalLoginScreen";
import JobsRouteScreen from "../pages/JobsRouteScreen";
import JobDetailScreen from "../pages/hr/JobDetailScreen";
import AdaptiveLayout from "../guards/AdaptiveLayout";
import LandingPageScreen from "../pages/public/LandingPageScreen";

const publicRoutes = (
  <>
    <Route element={<AdaptiveLayout />}>
      <Route path="/home" element={<LandingPageScreen />} />
      <Route path="/jobs" element={<JobsRouteScreen />} />
      <Route path="/internal/jobs" element={<Navigate to="/jobs" replace />} />
      <Route
        path="/internal/jobs/create"
        element={<Navigate to="/hr/jobs/create" replace />}
      />
      <Route path="/jobs/:jobId" element={<JobDetailScreen />} />
    </Route>

    <Route element={<PublicOnly />}>
      <Route path="/login" element={<CandidateLoginScreen />} />
      <Route path="/register" element={<CandidateRegisterScreen />} />
      <Route path="/internal/login" element={<InternalLoginScreen />} />
    </Route>
  </>
);

export default publicRoutes;
