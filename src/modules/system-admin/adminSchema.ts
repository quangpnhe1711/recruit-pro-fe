// System Admin console DTOs — mirror RecruitPro.Application.DTOs.Response.SysAdmin (backend).

export type RbacRoleDto = {
  id: string;
  name: string;
  description: string | null;
  userCount: number;
  permissionCount: number;
  isSystemAdmin: boolean;
};

export type RbacActionDto = {
  code: string;
  action: "Read" | "Create" | "Update" | "Delete" | "Approve" | "Apply" | "Review" | "Manage";
  name: string;
  description: string | null;
  isCritical: boolean;
};

export type RbacModuleDto = {
  key: string;
  group: "recruitment" | "candidate" | "notifications" | "system";
  actions: RbacActionDto[];
};

export type RolePermissionsDto = {
  roleId: string;
  roleName: string;
  roleDescription: string | null;
  grantedCodes: string[];
};

export type RbacRoleRefDto = {
  id: string;
  name: string;
};

export type SysAdminUserDto = {
  id: string;
  username: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  createdAt: string | null;
  roles: RbacRoleRefDto[];
};

export type SystemLogDto = {
  id: string;
  action: string | null;
  description: string | null;
  createdAt: string | null;
  userId: string | null;
  userFullName: string | null;
  userEmail: string | null;
};

export type SysAdminOverviewDto = {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  totalPermissions: number;
  openJobs: number;
  jobsClosingSoon: number;
  pendingApprovalJobs: number;
  totalApplications: number;
  applicationsLast7Days: number;
  upcomingInterviews: number;
  enabledWorkflows: number;
  executionsLast7Days: number;
  failedExecutionsLast7Days: number;
  recentLogs: SystemLogDto[];
  roles: RbacRoleDto[];
};
