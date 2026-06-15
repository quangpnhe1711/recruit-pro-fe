import { useSelector } from "react-redux";

import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../permissions/permissions";
import { ROLE_NAMES } from "../../../permissions/rolePermissions";
import HeaderAvatarDropDown from "../../../pages/internal/HeaderAvatarDropDown";
import type { RootState } from "../../../store";

export type AppHeaderMenuItem = {
  label: string;
  to: string;
};

type AppHeaderProps = {
  showNotifications?: boolean;
  menuItems?: AppHeaderMenuItem[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const defaultMenuItems: AppHeaderMenuItem[] = [
  { label: "Hồ sơ", to: "/candidate/profile" },
];

function formatRoleLabel(
  role: string | null | undefined,
  portalVariant: "candidate" | "internal",
) {
  if (portalVariant === "candidate") {
    return "Ứng viên";
  }

  switch (role) {
    case ROLE_NAMES.HR:
      return "HR";
    case ROLE_NAMES.MANAGER:
      return "Quản lý";
    case ROLE_NAMES.SYSTEM_ADMIN:
      return "Quản trị hệ thống";
    default:
      return "Người dùng nội bộ";
  }
}

function AppHeader({ showNotifications = true, menuItems }: AppHeaderProps) {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { defaultPath, hasPermission, portalVariant, primaryRole } =
    usePermissions();

  const userName = authUser?.fullName ?? "Chưa có người dùng";
  const userRole = formatRoleLabel(primaryRole, portalVariant);
  const avatarSrc = authUser?.avatarUrl ?? undefined;
  const resolvedInitials = getInitials(userName);
  const canViewOwnProfile = hasPermission(
    PERMISSIONS.CANDIDATE_VIEW_OWN_PROFILE,
  );
  const canViewInternalProfile = hasPermission(
    PERMISSIONS.PROFILE_VIEW_INTERNAL,
  );
  const resolvedMenuItems =
    menuItems ??
    (portalVariant === "candidate"
      ? defaultMenuItems
      : [
          ...(canViewInternalProfile
            ? [{ label: "Hồ sơ", to: "/internal/profile" }]
            : canViewOwnProfile
              ? [{ label: "Hồ sơ", to: "/candidate/profile" }]
              : []),
          ...(primaryRole === ROLE_NAMES.SYSTEM_ADMIN
            ? [{ label: "Bảng điều khiển Admin", to: "/system-admin/dashboard" }]
            : []),
          { label: "Tổng quan", to: defaultPath },
        ]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2dfde] bg-white overflow-x-hidden">
      <div className="mx-auto flex h-16  items-center justify-between gap-4 px-4 md:px-10">
        <div className="flex flex-1 items-center" />

        <div className="flex items-center gap-4 md:gap-6">
          {showNotifications ? (
            <div className="hidden items-center gap-4 border-r border-[#e2dfde] pr-6 md:flex">
              <button
                className="text-[#5f5e5e] transition-colors hover:text-[#b90014]"
                type="button"
              >
                <span className="material-symbols-outlined">notifications</span>
              </button>
            </div>
          ) : null}

          <div className="flex cursor-pointer items-center gap-3">
            <HeaderAvatarDropDown
              name={userName}
              role={userRole}
              avatarSrc={avatarSrc}
              initials={resolvedInitials}
              items={resolvedMenuItems}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
