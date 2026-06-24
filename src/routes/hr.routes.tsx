import { Route } from "react-router-dom";

import RequireAuth from "../guards/RequireAuth";
import RouteGuard from "../guards/RouteGuard";
import { PERMISSIONS } from "../permissions/permissions";

import HrDashboardScreen from "../pages/hr/HrDashboardScreen";
import CandidateListScreen from "../pages/hr/CandidateListScreen";
import CandidateImportScreen from "../pages/hr/CandidateImportScreen";
import CandidateProfileScreen from "../pages/hr/CandidateProfileScreen";
import CandidateApplicationScreen from "../pages/hr/CandidateApplicationScreen";
import CandidateReviewDetailScreen from "../pages/hr/CandidateReviewDetailScreen";
import SendOfferScreen from "../pages/hr/SendOfferScreen";
import ManagerCandidateReviewListScreen from "../pages/hr/ManagerCandidateReviewListScreen";
import ManagerDashboardScreen from "../pages/manager/ManagerDashboardScreen";
import ManagerJobApprovalDetailScreen from "../pages/manager/ManagerJobApprovalDetailScreen";
import ManagerRecruitmentAnalyticsScreen from "../pages/manager/ManagerRecruitmentAnalyticsScreen";
import JobCreatingScreen from "../pages/hr/JobCreatingScreen";
import JobInterviewListScreen from "../pages/hr/JobInterviewListScreen";
import InterviewScheduleScreen from "../pages/hr/InterviewScheduleScreen";
import AiCopilotScreen from "../pages/hr/AiCopilotScreen";
import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";
import FeaturePlaceholderScreen from "../pages/FeaturePlaceholderScreen";

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
          element={<HrDashboardScreen />}
        />
        <Route
          path="/manager/dashboard"
          element={<ManagerDashboardScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.PROFILE_VIEW_INTERNAL} />}
      >
        <Route
          path="/internal/profile"
          element={
            <FeaturePlaceholderScreen
              title="Internal Profile"
              description="Khu vực hồ sơ nội bộ đang chờ hỗ trợ từ backend."
            />
          }
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.JOB_CREATE} />}
      >
        <Route
          path="/hr/jobs/create"
          element={<JobCreatingScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.CANDIDATE_VIEW_LIST} />}
      >
        <Route
          path="/hr/candidates"
          element={<CandidateListScreen />}
        />
        <Route
          path="/hr/candidates/import"
          element={<CandidateImportScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.CANDIDATE_VIEW_DETAIL} />}
      >
        <Route
          path="/hr/candidates/:candidateId"
          element={<CandidateProfileScreen />}
        />
        <Route
          path="/manager/candidates/:candidateId"
          element={<CandidateProfileScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.APPLICATION_VIEW_ALL} />}
      >
        <Route
          path="/hr/applications"
          element={<CandidateApplicationScreen />}
        />
        <Route
          path="/manager/applications"
          element={<ManagerCandidateReviewListScreen />}
        />
        <Route
          path="/hr/applications/:applicationId"
          element={<CandidateReviewDetailScreen />}
        />
        <Route
          path="/hr/applications/:applicationId/send-offer"
          element={<SendOfferScreen />}
        />
        <Route
          path="/manager/applications/:applicationId"
          element={<CandidateReviewDetailScreen />}
        />
        <Route
          path="/hr/ai-copilot"
          element={<AiCopilotScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.INTERVIEW_VIEW_ALL} />}
      >
        <Route
          path="/hr/interviews"
          element={<JobInterviewListScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.REPORT_VIEW} />}
      >
        <Route
          path="/manager/reports"
          element={<ManagerRecruitmentAnalyticsScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.JOB_APPROVE} />}
      >
        <Route
          path="/manager/jobs/:jobId/approval"
          element={<ManagerJobApprovalDetailScreen />}
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
          element={<InterviewScheduleScreen />}
        />
      </Route>

      <Route
        element={<RouteGuard permissions={PERMISSIONS.SYSTEM_ADMIN} />}
      >
        <Route
          path="/system-admin/dashboard"
          element={
            <FeaturePlaceholderScreen
              title="System Admin Dashboard"
              description="Bảng điều khiển quản trị hệ thống đang chờ hỗ trợ từ backend."
            />
          }
        />
        <Route
          path="/system-admin/users"
          element={
            <FeaturePlaceholderScreen
              title="User Management"
              description="Quản lý người dùng đang chờ hỗ trợ từ backend."
            />
          }
        />
        <Route
          path="/system-admin/roles"
          element={
            <FeaturePlaceholderScreen
              title="Role Management"
              description="Quản lý vai trò đang chờ hỗ trợ từ backend."
            />
          }
        />
        <Route
          path="/system-admin/permissions"
          element={
            <FeaturePlaceholderScreen
              title="Permission Management"
              description="Quản lý quyền đang chờ hỗ trợ từ backend."
            />
          }
        />
        <Route
          path="/system-admin/audit-logs"
          element={
            <FeaturePlaceholderScreen
              title="Audit Logs"
              description="Nhật ký kiểm toán đang chờ hỗ trợ từ backend."
            />
          }
        />
      </Route>
    </Route>
  </Route>
);

export default hrRoutes;
