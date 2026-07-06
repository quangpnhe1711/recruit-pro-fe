import type { ApiResponse } from "../../common/types";
import type { Paginated } from "../../modules/system-admin/automationSchema";
import type {
  RbacModuleDto,
  RbacRoleDto,
  RolePermissionsDto,
  SysAdminOverviewDto,
  SysAdminUserDto,
  SystemLogDto,
} from "../../modules/system-admin/adminSchema";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

const api = endpoints.sysadmin.admin;

export async function getOverview(): Promise<SysAdminOverviewDto> {
  const res = await request.get<ApiResponse<SysAdminOverviewDto>>(api.overview);
  return res.data!;
}

export async function listRoles(): Promise<RbacRoleDto[]> {
  const res = await request.get<ApiResponse<RbacRoleDto[]>>(api.rbacRoles);
  return res.data ?? [];
}

export async function listModules(): Promise<RbacModuleDto[]> {
  const res = await request.get<ApiResponse<RbacModuleDto[]>>(api.rbacModules);
  return res.data ?? [];
}

export async function getRolePermissions(roleId: string): Promise<RolePermissionsDto> {
  const res = await request.get<ApiResponse<RolePermissionsDto>>(api.rolePermissions(roleId));
  return res.data!;
}

export async function updateRolePermissions(
  roleId: string,
  permissionCodes: string[],
): Promise<RolePermissionsDto> {
  const res = await request.put<ApiResponse<RolePermissionsDto>, { permissionCodes: string[] }>(
    api.rolePermissions(roleId),
    { permissionCodes },
  );
  return res.data!;
}

export async function listUsers(params?: {
  q?: string;
  roleId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<SysAdminUserDto>> {
  const res = await request.get<ApiResponse<Paginated<SysAdminUserDto>>>(api.users, { params });
  return res.data!;
}

export async function updateUserStatus(userId: string, status: string): Promise<SysAdminUserDto> {
  const res = await request.patch<ApiResponse<SysAdminUserDto>, { status: string }>(
    api.userStatus(userId),
    { status },
  );
  return res.data!;
}

export async function updateUserRoles(userId: string, roleIds: string[]): Promise<SysAdminUserDto> {
  const res = await request.put<ApiResponse<SysAdminUserDto>, { roleIds: string[] }>(
    api.userRoles(userId),
    { roleIds },
  );
  return res.data!;
}

export async function listAuditLogs(params?: {
  q?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}): Promise<Paginated<SystemLogDto>> {
  const res = await request.get<ApiResponse<Paginated<SystemLogDto>>>(api.auditLogs, { params });
  return res.data!;
}
