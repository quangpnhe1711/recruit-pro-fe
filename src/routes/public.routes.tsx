import { Route } from "react-router-dom";

import PublicOnly from "../guards/PublicOnly";

import CandidateLoginScreen from "../pages/public/CandidateLoginScreen";
import CandidateRegisterScreen from "../pages/public/CandidateRegisterScreen";
import InternalLoginScreen from "../pages/internal/InternalLoginScreen";
import JobsRouteScreen from "../pages/JobsRouteScreen";
import AdaptiveLayout from "../guards/AdaptiveLayout";
import LandingPageScreen from "../pages/public/LandingPageScreen";

const publicRoutes = (
  <>
    <Route element={<AdaptiveLayout />}>
      <Route path="/home" element={<LandingPageScreen />} />
      <Route path="/jobs" element={<JobsRouteScreen />} />
    </Route>

    <Route element={<PublicOnly />}>
      <Route path="/login" element={<CandidateLoginScreen />} />
      <Route path="/register" element={<CandidateRegisterScreen />} />
      <Route path="/internal/login" element={<InternalLoginScreen />} />
    </Route>
  </>
);

export default publicRoutes;
