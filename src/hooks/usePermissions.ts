import { useMemo } from "react";
import { useSelector } from "react-redux";

import type { RootState } from "../store";
import {
  PERMISSIONS,
  normalizePermission,
  type Permission,
  type PortalVariant,
} from "../permissions/permissions";
import {
  getEffectivePermissions,
  getRoleHomePath,
  getPrimaryRole,
  resolvePortalVariant,
} from "../permissions/rolePermissions";

type PermissionInput = Permission | Permission[];

function toPermissionList(required?: PermissionInput) {
  if (!required) {
    return [];
  }

  return Array.isArray(required) ? required : [required];
}

function getDefaultPathForVariant(
  variant: PortalVariant,
  permissions: Set<string>,
  primaryRole: string | null,
) {
  const roleHomePath = getRoleHomePath(primaryRole);

  if (roleHomePath) {
    return roleHomePath;
  }

  if (variant === "internal") {
    if (permissions.has(PERMISSIONS.DASHBOARD_VIEW_INTERNAL)) return "/hr/dashboard";
    if (permissions.has(PERMISSIONS.JOB_LIST)) return "/internal/jobs";
    if (permissions.has(PERMISSIONS.CANDIDATE_VIEW_LIST)) return "/hr/candidates";
    if (permissions.has(PERMISSIONS.APPLICATION_VIEW_ALL)) return "/hr/applications";
    if (permissions.has(PERMISSIONS.INTERVIEW_VIEW_ALL)) return "/hr/interviews";
    return "/internal/login";
  }

  if (permissions.has(PERMISSIONS.DASHBOARD_VIEW_OWN)) return "/candidate/dashboard";
  if (permissions.has(PERMISSIONS.INTERVIEW_VIEW_OWN)) return "/candidate/interviews";
  if (permissions.has(PERMISSIONS.APPLICATION_VIEW_OWN)) {
    return "/candidate/my-applications";
  }
  if (permissions.has(PERMISSIONS.CANDIDATE_VIEW_OWN_PROFILE)) {
    return "/candidate/profile";
  }
  return "/login";
}

export function usePermissions() {
  const authState = useSelector((state: RootState) => state.auth);
  const user = authState.user;

  const permissionList = useMemo(() => getEffectivePermissions(user), [user]);

  const permissionSet = useMemo(
    () => new Set(permissionList.map((permission) => normalizePermission(permission))),
    [permissionList],
  );

  const primaryRole = useMemo(
    () => getPrimaryRole(user?.roles ?? []),
    [user],
  );

  const portalVariant = useMemo(
    () =>
      resolvePortalVariant(
        user?.roles ?? [],
        authState.currentVariant ?? "candidate",
      ),
    [authState.currentVariant, user],
  );

  const defaultPath = useMemo(
    () => getDefaultPathForVariant(portalVariant, permissionSet, primaryRole),
    [permissionSet, portalVariant, primaryRole],
  );

  function hasPermission(permission: Permission) {
    return permissionSet.has(normalizePermission(permission));
  }

  function hasAnyPermission(required?: PermissionInput) {
    const requiredPermissions = toPermissionList(required);
    if (!requiredPermissions.length) {
      return true;
    }

    return requiredPermissions.some((permission) => hasPermission(permission));
  }

  function hasAllPermissions(required?: PermissionInput) {
    const requiredPermissions = toPermissionList(required);
    if (!requiredPermissions.length) {
      return true;
    }

    return requiredPermissions.every((permission) => hasPermission(permission));
  }

  function canAccess(required?: PermissionInput, requireAll = false) {
    return requireAll
      ? hasAllPermissions(required)
      : hasAnyPermission(required);
  }

  return {
    currentVariant: authState.currentVariant,
    defaultPath,
    hasAllPermissions,
    hasAnyPermission,
    hasPermission,
    isAuthenticated: authState.isAuthenticated,
    permissions: permissionList,
    permissionSet,
    primaryRole,
    portalVariant,
    user,
    canAccess,
  };
}
