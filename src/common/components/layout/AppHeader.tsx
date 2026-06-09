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
  { label: "Profile", to: "/candidate/profile" },
];

function formatRoleLabel(role: string | null | undefined, portalVariant: "candidate" | "internal") {
  if (portalVariant === "candidate") {
    return "Candidate";
  }

  switch (role) {
    case ROLE_NAMES.HR:
      return "HR";
    case ROLE_NAMES.MANAGER:
      return "Manager";
    case ROLE_NAMES.SYSTEM_ADMIN:
      return "System Admin";
    default:
      return "Internal User";
  }
}

function AppHeader({
  showNotifications = true,
  menuItems,
}: AppHeaderProps) {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const { defaultPath, hasPermission, portalVariant, primaryRole } = usePermissions();

  const userName = authUser?.fullName ?? "No user";
  const userRole = formatRoleLabel(primaryRole, portalVariant);
  const avatarSrc = authUser?.avatarUrl ?? undefined;
  const resolvedInitials = getInitials(userName);
  const canViewOwnProfile = hasPermission(PERMISSIONS.CANDIDATE_VIEW_OWN_PROFILE);
  const canViewInternalProfile = hasPermission(PERMISSIONS.PROFILE_VIEW_INTERNAL);
  const resolvedMenuItems =
    menuItems ??
    (portalVariant === "candidate"
      ? defaultMenuItems
      : [
          ...(canViewInternalProfile
            ? [{ label: "Profile", to: "/internal/profile" }]
            : canViewOwnProfile
              ? [{ label: "Profile", to: "/candidate/profile" }]
            : []),
          ...(primaryRole === ROLE_NAMES.SYSTEM_ADMIN
            ? [{ label: "Admin Dashboard", to: "/system-admin/dashboard" }]
            : []),
          { label: "Dashboard", to: defaultPath },
        ]);

  return (
    <header className="sticky top-0 z-40 border-b border-[#e2dfde] bg-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 md:px-10">
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
