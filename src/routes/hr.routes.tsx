import { lazy, Suspense, type ReactNode } from "react";
import RouteFallback from "../common/components/RouteFallback";
import { Route } from "react-router-dom";

import RequireAuth from "../guards/RequireAuth";
import RouteGuard from "../guards/RouteGuard";
import { PERMISSIONS } from "../permissions/permissions";

import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";

const HrDashboardScreen = lazy(() => import("../pages/hr/HrDashboardScreen"));
const InternalProfileScreen = lazy(() => import("../pages/internal/InternalProfileScreen"));
const CandidateListScreen = lazy(() => import("../pages/hr/CandidateListScreen"));
const CandidateImportScreen = lazy(() => import("../pages/hr/CandidateImportScreen"));
const CandidateCreateScreen = lazy(() => import("../pages/hr/CandidateCreateScreen"));
const CandidateProfileScreen = lazy(() => import("../pages/hr/CandidateProfileScreen"));
const CandidateApplicationScreen = lazy(() => import("../pages/hr/CandidateApplicationScreen"));
const CandidateReviewDetailScreen = lazy(() => import("../pages/hr/CandidateReviewDetailScreen"));
const SendOfferScreen = lazy(() => import("../pages/hr/SendOfferScreen"));
const ManagerCandidateReviewListScreen = lazy(() => import("../pages/hr/ManagerCandidateReviewListScreen"));
const ManagerDashboardScreen = lazy(() => import("../pages/manager/ManagerDashboardScreen"));
const ManagerJobApprovalDetailScreen = lazy(() => import("../pages/manager/ManagerJobApprovalDetailScreen"));
const ManagerRecruitmentAnalyticsScreen = lazy(() => import("../pages/manager/ManagerRecruitmentAnalyticsScreen"));
const JobCreatingScreen = lazy(() => import("../pages/hr/JobCreatingScreen"));
const JobsRouteScreen = lazy(() => import("../pages/JobsRouteScreen"));
const JobDetailScreen = lazy(() => import("../pages/public/JobDetailScreen"));
const JobInterviewListScreen = lazy(() => import("../pages/hr/JobInterviewListScreen"));
const InterviewScheduleScreen = lazy(() => import("../pages/hr/InterviewScheduleScreen"));
const AiCopilotScreen = lazy(() => import("../pages/hr/AiCopilotScreen"));

function lazyRoute(element: ReactNode) {
  return (
    <Suspense fallback={<RouteFallback />}>
      {element}
    </Suspense>
  );
}

const hrRoutes = (
  <Route element={<RequireAuth />}>
    <Route element={<AuthenticatedLayout />}>
      <Route
        element={  
          <RouteGuard permissions={PERMISSIONS.DASHBOARD_VIEW_INTERNAL} />
        }
      >
        <Route
          path="/hr/dashboard"
          element={lazyRoute(<HrDashboardScreen />)}
        />
        <Route
          path="/manager/dashboard"
          element={lazyRoute(<ManagerDashboardScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.PROFILE_VIEW_INTERNAL} />}
      >
        <Route
          path="/internal/profile"
          element={lazyRoute(<InternalProfileScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.JOB_CREATE} />}
      >
        <Route
          path="/hr/jobs/create"
          element={lazyRoute(<JobCreatingScreen />)}
        />
      </Route>

      {/* Internal jobs list. "/jobs" belongs to the CANDIDATE portal (authSession.portalForPath),
          so an internal-only user landing there gets the public listing and no internal API token.
          Internal navigation therefore targets this internal-portal path; JobsRouteScreen still
          dispatches HR → management, Manager/HeadDept → approval queue. */}
      <Route
        element={
          <RouteGuard
            permissions={[PERMISSIONS.JOB_LIST, PERMISSIONS.JOB_APPROVE]}
          />
        }
      >
        <Route
          path="/internal/jobs"
          element={lazyRoute(<JobsRouteScreen />)}
        />
        {/* Internal job detail. Same screen as the public "/jobs/:jobId", but reached under the
            /internal prefix so authSession.portalForPath resolves the INTERNAL portal — otherwise an
            HR/manager opening job detail runs as the candidate portal, sends no internal token, and
            gets bounced to the candidate login on the 401. */}
        <Route
          path="/internal/jobs/:jobId"
          element={lazyRoute(<JobDetailScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.CANDIDATE_VIEW_LIST} />}
      >
        <Route
          path="/hr/candidates"
          element={lazyRoute(<CandidateListScreen />)}
        />
        <Route
          path="/hr/candidates/import"
          element={lazyRoute(<CandidateImportScreen />)}
        />
        <Route
          path="/hr/candidates/create"
          element={lazyRoute(<CandidateCreateScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.CANDIDATE_VIEW_DETAIL} />}
      >
        <Route
          path="/hr/candidates/:candidateId"
          element={lazyRoute(<CandidateProfileScreen />)}
        />
        <Route
          path="/manager/candidates/:candidateId"
          element={lazyRoute(<CandidateProfileScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.APPLICATION_VIEW_ALL} />}
      >
        <Route
          path="/hr/applications"
          element={lazyRoute(<CandidateApplicationScreen />)}
        />
        <Route
          path="/manager/applications"
          element={lazyRoute(<ManagerCandidateReviewListScreen />)}
        />
        <Route
          path="/hr/applications/:applicationId"
          element={lazyRoute(<CandidateReviewDetailScreen />)}
        />
        <Route
          path="/hr/applications/:applicationId/send-offer"
          element={lazyRoute(<SendOfferScreen />)}
        />
        <Route
          path="/manager/applications/:applicationId"
          element={lazyRoute(<CandidateReviewDetailScreen />)}
        />
        <Route
          path="/hr/ai-copilot"
          element={lazyRoute(<AiCopilotScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.INTERVIEW_VIEW_ALL} />}
      >
        <Route
          path="/hr/interviews"
          element={lazyRoute(<JobInterviewListScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.REPORT_VIEW} />}
      >
        <Route
          path="/manager/reports"
          element={lazyRoute(<ManagerRecruitmentAnalyticsScreen />)}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.JOB_APPROVE} />}
      >
        <Route
          path="/manager/jobs/:jobId/approval"
          element={lazyRoute(<ManagerJobApprovalDetailScreen />)}
        />
      </Route>

      <Route
        element={
          <RouteGuard
            permissions={[
              PERMISSIONS.INTERVIEW_VIEW_SCHEDULE_DATA,
              PERMISSIONS.INTERVIEW_CREATE,
            ]}
            requireAll
          />
        }
        >
        <Route
          path="/hr/interviews/schedule"
          element={lazyRoute(<InterviewScheduleScreen />)}
        />
      </Route>

    </Route>
  </Route>
);

export default hrRoutes;
