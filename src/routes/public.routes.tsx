import { lazy, Suspense, type ReactNode } from "react";
import RouteFallback from "../common/components/RouteFallback";
import { Navigate, Route } from "react-router-dom";

import PublicOnly from "../guards/PublicOnly";

import AdaptiveLayout from "../guards/AdaptiveLayout";
import PublicLayout from "../common/components/layout/PublicLayout";

const CandidateLoginScreen = lazy(() => import("../pages/public/CandidateLoginScreen"));
const CandidateRegisterScreen = lazy(() => import("../pages/public/CandidateRegisterScreen"));
const InternalLoginScreen = lazy(() => import("../pages/internal/InternalLoginScreen"));
const JobsRouteScreen = lazy(() => import("../pages/JobsRouteScreen"));
const JobDetailScreen = lazy(() => import("../pages/public/JobDetailScreen"));
const LandingPageScreen = lazy(() => import("../pages/public/LandingPageScreen"));

function lazyRoute(element: ReactNode) {
  return (
    <Suspense fallback={<RouteFallback />}>
      {element}
    </Suspense>
  );
}

const publicRoutes = (
  <>
  <Route element={<PublicLayout />}>
      <Route path="/" element={lazyRoute(<LandingPageScreen />)} />
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Route>

    <Route element={<AdaptiveLayout />}>
      <Route path="/jobs" element={lazyRoute(<JobsRouteScreen />)} />
      {/* /internal/jobs is a real internal-portal route now (hr.routes.tsx) — no redirect here. */}
      <Route
        path="/internal/jobs/create"
        element={<Navigate to="/hr/jobs/create" replace />}
      />

      <Route path="/jobs/:jobId" element={lazyRoute(<JobDetailScreen />)} />
    </Route>

    <Route element={<PublicOnly />}>
      <Route path="/login" element={lazyRoute(<CandidateLoginScreen />)} />
      <Route path="/register" element={lazyRoute(<CandidateRegisterScreen />)} />
      <Route path="/internal/login" element={lazyRoute(<InternalLoginScreen />)} />
    </Route>
  </>
);

export default publicRoutes;
