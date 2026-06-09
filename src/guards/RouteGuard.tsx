import { Navigate, Outlet, useLocation } from "react-router-dom";

import { usePermissions } from "../hooks/usePermissions";
import type { Permission } from "../permissions/permissions";

type RouteGuardProps = {
  permissions?: Permission | Permission[];
  redirectTo?: string;
  requireAll?: boolean;
};

function RouteGuard({
  permissions,
  redirectTo,
  requireAll = false,
}: RouteGuardProps) {
  const location = useLocation();
  const { canAccess, defaultPath, isAuthenticated } = usePermissions();

  if (!isAuthenticated) {
    const loginPath =
      location.pathname.startsWith("/hr") || location.pathname.startsWith("/internal")
        ? "/internal/login"
        : "/login";

    return (
      <Navigate
        to={loginPath}
        replace
        state={{ from: location }}
      />
    );
  }

  if (!canAccess(permissions, requireAll)) {
    return <Navigate to={redirectTo ?? defaultPath} replace />;
  }

  return <Outlet />;
}

export default RouteGuard;
