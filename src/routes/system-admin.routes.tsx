import { lazy, Suspense, type ReactNode } from "react";
import { Route } from "react-router-dom";

import RequireAuth from "../guards/RequireAuth";
import RouteGuard from "../guards/RouteGuard";
import { PERMISSIONS } from "../permissions/permissions";

import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";
import FeaturePlaceholderScreen from "../pages/FeaturePlaceholderScreen";

// SystemAdmin is its OWN role/area — kept in a dedicated route module, separate from the HR portal.
const AutomationDashboardScreen = lazy(() => import("../pages/system-admin/AutomationDashboardScreen"));
const WorkflowListScreen = lazy(() => import("../pages/system-admin/WorkflowListScreen"));
const WorkflowDetailScreen = lazy(() => import("../pages/system-admin/WorkflowDetailScreen"));
const ExecutionHistoryScreen = lazy(() => import("../pages/system-admin/ExecutionHistoryScreen"));
const ExecutionDetailScreen = lazy(() => import("../pages/system-admin/ExecutionDetailScreen"));
const DiagnosticsScreen = lazy(() => import("../pages/system-admin/DiagnosticsScreen"));
const EventsScreen = lazy(() => import("../pages/system-admin/EventsScreen"));
const McpToolsScreen = lazy(() => import("../pages/system-admin/McpToolsScreen"));
const McpAuditScreen = lazy(() => import("../pages/system-admin/McpAuditScreen"));

function lazyRoute(element: ReactNode) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[#5f6368]">Loading...</div>}>
      {element}
    </Suspense>
  );
}

const systemAdminRoutes = (
  <Route element={<RequireAuth />}>
    <Route element={<AuthenticatedLayout />}>
      <Route element={<RouteGuard permissions={PERMISSIONS.SYSTEM_ADMIN} />}>
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

        {/* v4 Workflow Automation + MCP */}
        <Route path="/system-admin/automation" element={lazyRoute(<AutomationDashboardScreen />)} />
        <Route path="/system-admin/automation/workflows" element={lazyRoute(<WorkflowListScreen />)} />
        <Route path="/system-admin/automation/workflows/:id" element={lazyRoute(<WorkflowDetailScreen />)} />
        <Route path="/system-admin/automation/executions" element={lazyRoute(<ExecutionHistoryScreen />)} />
        <Route path="/system-admin/automation/executions/:id" element={lazyRoute(<ExecutionDetailScreen />)} />
        <Route path="/system-admin/automation/events" element={lazyRoute(<EventsScreen />)} />
        <Route path="/system-admin/automation/diagnostics" element={lazyRoute(<DiagnosticsScreen />)} />
        <Route path="/system-admin/mcp/tools" element={lazyRoute(<McpToolsScreen />)} />
        <Route path="/system-admin/mcp/audits" element={lazyRoute(<McpAuditScreen />)} />
      </Route>
    </Route>
  </Route>
);

export default systemAdminRoutes;
