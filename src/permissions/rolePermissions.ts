import type { UserDto } from "../modules/auth/authSchema";
import {
  CANDIDATE_PORTAL_PERMISSIONS,
  HEAD_DEPARTMENT_PORTAL_PERMISSIONS,
  HR_PORTAL_PERMISSIONS,
  INTERNAL_PORTAL_PERMISSIONS,
  MANAGER_PORTAL_PERMISSIONS,
  SYSTEM_ADMIN_PERMISSIONS,
  type Permission,
  type PortalVariant,
  normalizePermission,
} from "./permissions";

export const ROLE_NAMES = {
  CANDIDATE: "candidate",
  HR: "hr",
  HEAD_DEPARTMENT: "headdepartment",
  MANAGER: "manager",
  SYSTEM_ADMIN: "systemadmin",
} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

const candidatePermissions = [...CANDIDATE_PORTAL_PERMISSIONS];
const hrPermissions = [...HR_PORTAL_PERMISSIONS];
const headDepartmentPermissions = [...HEAD_DEPARTMENT_PORTAL_PERMISSIONS];
const managerPermissions = [...MANAGER_PORTAL_PERMISSIONS];
const systemAdminPermissions = [...SYSTEM_ADMIN_PERMISSIONS];

const rolePermissionsMap: Record<string, Permission[]> = {
  [ROLE_NAMES.CANDIDATE]: candidatePermissions,
  [ROLE_NAMES.HR]: hrPermissions,
  [ROLE_NAMES.HEAD_DEPARTMENT]: headDepartmentPermissions,
  [ROLE_NAMES.MANAGER]: managerPermissions,
  [ROLE_NAMES.SYSTEM_ADMIN]: systemAdminPermissions,
};

export const rolePermissions = rolePermissionsMap;

export function normalizeRole(role: string) {
  return role.trim().toLowerCase();
}

export function getPrimaryRole(roles: string[]): RoleName | null {
  for (const role of roles) {
    const normalizedRole = normalizeRole(role);

    if (normalizedRole in rolePermissionsMap) {
      return normalizedRole as RoleName;
    }
  }

  return null;
}

export function getRoleHomePath(role: string | null) {
  switch (role) {
    case ROLE_NAMES.CANDIDATE:
      return "/candidate/dashboard";
    case ROLE_NAMES.HR:
      return "/hr/dashboard";
    case ROLE_NAMES.HEAD_DEPARTMENT:
      return "/hr/dashboard";
    case ROLE_NAMES.MANAGER:
      return "/manager/dashboard";
    case ROLE_NAMES.SYSTEM_ADMIN:
      return "/system-admin/dashboard";
    default:
      return null;
  }
}

export function getPermissionsForRoles(roles: string[]) {
  const permissions = new Set<string>();

  for (const role of roles) {
    const mappedPermissions = rolePermissionsMap[normalizeRole(role)] ?? [];

    for (const permission of mappedPermissions) {
      permissions.add(normalizePermission(permission));
    }
  }

  return Array.from(permissions) as Permission[];
}

export function getEffectivePermissions(user: UserDto | null) {
  if (!user) {
    return [] as Permission[];
  }

  const merged = new Set<string>();

  for (const permission of user.permissions ?? []) {
    merged.add(normalizePermission(permission));
  }

  for (const permission of getPermissionsForRoles(user.roles ?? [])) {
    merged.add(normalizePermission(permission));
  }

  return Array.from(merged) as Permission[];
}

export function resolvePortalVariant(
  roles: string[],
  fallback: PortalVariant = "candidate",
) {
  const primaryRole = getPrimaryRole(roles);
  if (!primaryRole) return fallback;

  return primaryRole === ROLE_NAMES.CANDIDATE ? "candidate" : "internal";
}

export function resolvePortalVariantFromUser(
  user: UserDto | null,
  fallback: PortalVariant = "candidate",
) {
  return resolvePortalVariant(user?.roles ?? [], fallback);
}
