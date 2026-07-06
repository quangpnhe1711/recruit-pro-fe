import { lazy, Suspense, type ReactNode } from "react";
import RouteFallback from "../common/components/RouteFallback";
import { Route } from "react-router-dom";

import RequireAuth from "../guards/RequireAuth";
import RouteGuard from "../guards/RouteGuard";
import { PERMISSIONS } from "../permissions/permissions";

import AuthenticatedLayout from "../common/components/layout/AuthenticatedLayout";

// SystemAdmin is its OWN role/area — kept in a dedicated route module, separate from the HR portal.
const AdminOverviewScreen = lazy(() => import("../pages/system-admin/AdminOverviewScreen"));
const UserManagementScreen = lazy(() => import("../pages/system-admin/UserManagementScreen"));
const RoleManagementScreen = lazy(() => import("../pages/system-admin/RoleManagementScreen"));
const RbacPermissionsScreen = lazy(() => import("../pages/system-admin/RbacPermissionsScreen"));
const AuditLogScreen = lazy(() => import("../pages/system-admin/AuditLogScreen"));
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
    <Suspense fallback={<RouteFallback />}>
      {element}
    </Suspense>
  );
}

const systemAdminRoutes = (
  <Route element={<RequireAuth />}>
    <Route element={<AuthenticatedLayout />}>
      <Route element={<RouteGuard permissions={PERMISSIONS.SYSTEM_ADMIN} />}>
        {/* System console — backed by /api/sysadmin/* with per-permission guards on the backend */}
        <Route path="/system-admin/dashboard" element={lazyRoute(<AdminOverviewScreen />)} />
        <Route path="/system-admin/users" element={lazyRoute(<UserManagementScreen />)} />
        <Route path="/system-admin/roles" element={lazyRoute(<RoleManagementScreen />)} />
        <Route path="/system-admin/permissions" element={lazyRoute(<RbacPermissionsScreen />)} />
        <Route path="/system-admin/audit-logs" element={lazyRoute(<AuditLogScreen />)} />

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
