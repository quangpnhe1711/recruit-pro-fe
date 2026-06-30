import { lazy, Suspense, type ReactNode } from "react";
import { Route } from "react-router-dom";

import RequireAuth from "../guards/RequireAuth";
import RouteGuard from "../guards/RouteGuard";
import { PERMISSIONS } from "../permissions/permissions";

import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";

const DashboardCandidateScreen = lazy(() => import("../pages/candidate/DashboardCandidateScreen"));
const MyApplicationScreen = lazy(() => import("../pages/candidate/MyApplicationScreen"));
const CandidateProfileAndCVManagementScreen = lazy(() => import("../pages/candidate/candidate-profile-screen/CandidateProfileAndCVManagementScreen"));
const CandidateInterviewScreen = lazy(() => import("../pages/candidate/CandidateInterviewScreen"));
const ApplyJobScreen = lazy(() => import("../pages/candidate/ApplyJobScreen"));

function lazyRoute(element: ReactNode) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#5f6368]">Loading...</div>}>
      {element}
    </Suspense>
  );
}

const candidateRoutes = (
  <Route element={<RequireAuth />}>
    <Route element={<AuthenticatedLayout />}>
      <Route
        element={<RouteGuard permissions={PERMISSIONS.DASHBOARD_VIEW_OWN} />}
      >
        <Route
          path="/candidate/dashboard"
          element={lazyRoute(<DashboardCandidateScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.APPLICATION_VIEW_OWN} />}
      >
        <Route path="/jobs/:jobId/apply" element={lazyRoute(<ApplyJobScreen />)} />

        <Route
          path="/candidate/my-applications"
          element={lazyRoute(<MyApplicationScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.INTERVIEW_VIEW_OWN} />}
      >
        <Route
          path="/candidate/interviews"
          element={lazyRoute(<CandidateInterviewScreen />)}
        />
      </Route>

      <Route
        element={
          <RouteGuard permissions={PERMISSIONS.CANDIDATE_VIEW_OWN_PROFILE} />
        }
      >
        <Route
          path="/candidate/profile/*"
          element={lazyRoute(<CandidateProfileAndCVManagementScreen />)}
        />
      </Route>
    </Route>
  </Route>
);

export default candidateRoutes;
