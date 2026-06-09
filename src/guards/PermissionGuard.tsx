import type { ReactNode } from "react";

import { usePermissions } from "../hooks/usePermissions";
import type { Permission } from "../permissions/permissions";

type PermissionGuardProps = {
  children: ReactNode;
  fallback?: ReactNode;
  permissions?: Permission | Permission[];
  requireAll?: boolean;
};

function PermissionGuard({
  children,
  fallback = null,
  permissions,
  requireAll = false,
}: PermissionGuardProps) {
  const { canAccess } = usePermissions();

  if (!canAccess(permissions, requireAll)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGuard;
