import { NavLink, useNavigate } from "react-router-dom";
import { RootState } from "../../../store";
import { useSelector } from "react-redux";
import { usePermissions } from "../../../hooks/usePermissions";
import { ROLE_NAMES } from "../../../permissions/rolePermissions";

export type SideNavItem = {
  icon: string;
  label: string;
  to: string;
};

type SideNavBrand = {
  title?: string;
  subtitle?: string;
  to?: string;
};

type SideNavBarProps = {
  variant?: "internal" | "candidate";
  items?: SideNavItem[];
  bottomItems?: SideNavItem[];
  brand?: SideNavBrand;
  showUserCard?: boolean;
  userName?: string;
  userRole?: string;
  userAvatarSrc?: string;
  initials?: string;
};

const hrItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Dashboard",
    to: "/hr/dashboard",
  },
  {
    icon: "work",
    label: "Jobs",
    to: "/jobs",
  },
  {
    icon: "group",
    label: "Candidates",
    to: "/hr/candidates",
  },
  {
    icon: "description",
    label: "Applications",
    to: "/hr/applications",
  },
  {
    icon: "schedule",
    label: "Interviews",
    to: "/hr/interviews",
  },
  {
    icon: "person",
    label: "Profile",
    to: "/internal/profile",
  },
];

const managerItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Dashboard",
    to: "/hr/dashboard",
  },
  {
    icon: "approval",
    label: "Job Approvals",
    to: "/jobs",
  },
  {
    icon: "description",
    label: "Applications",
    to: "/hr/applications",
  },
  {
    icon: "schedule",
    label: "Interviews",
    to: "/hr/interviews",
  },
  {
    icon: "analytics",
    label: "Reports",
    to: "/manager/reports",
  },
  {
    icon: "person",
    label: "Profile",
    to: "/internal/profile",
  },
];

const adminItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Dashboard",
    to: "/system-admin/dashboard",
  },
  {
    icon: "group",
    label: "Users",
    to: "/system-admin/users",
  },
  {
    icon: "shield_person",
    label: "Roles",
    to: "/system-admin/roles",
  },
  {
    icon: "admin_panel_settings",
    label: "Permissions",
    to: "/system-admin/permissions",
  },
  {
    icon: "history",
    label: "Audit Logs",
    to: "/system-admin/audit-logs",
  },
];

const internalBottomItems: SideNavItem[] = [];

const candidateItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Dashboard",
    to: "/candidate/dashboard",
  },
  {
    icon: "work",
    label: "Jobs",
    to: "/jobs",
  },
  {
    icon: "description",
    label: "My Applications",
    to: "/candidate/my-applications",
  },
  {
    icon: "schedule",
    label: "Interviews",
    to: "/candidate/interviews",
  },
  {
    icon: "person",
    label: "Profile",
    to: "/candidate/profile",
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatRoleLabel(role: string | null | undefined) {
  switch (role) {
    case ROLE_NAMES.CANDIDATE:
      return "Candidate";
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

function SideNavBar({
  showUserCard = true,
  userAvatarSrc,
}: SideNavBarProps) {
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);
  const { defaultPath, portalVariant, primaryRole } = usePermissions();

  const authUser = authState.user;

  const internalItems =
    primaryRole === ROLE_NAMES.SYSTEM_ADMIN
      ? adminItems
      : primaryRole === ROLE_NAMES.MANAGER
        ? managerItems
        : hrItems;

  const resolvedItems =
    portalVariant === "candidate" ? candidateItems : internalItems;

  const resolvedBottomItems =
    portalVariant === "candidate" ? [] : internalBottomItems;

  const resolvedBrand = {
    title: "RecruitPro",
    subtitle:
      portalVariant === "candidate"
        ? "Candidate Portal"
        : primaryRole === ROLE_NAMES.SYSTEM_ADMIN
          ? "System Administration"
          : primaryRole === ROLE_NAMES.MANAGER
            ? "Hiring Review"
            : "Recruitment Operations",
    to: defaultPath,
  };

  const resolvedUserName =
    authUser?.fullName ?? (portalVariant === "candidate" ? "Candidate" : "Internal User");
  const resolvedUserRole =
    portalVariant === "candidate"
      ? "Candidate"
      : formatRoleLabel(primaryRole);
  const resolvedInitials = resolvedUserName ? getInitials(resolvedUserName) : "";

  const resolvedCta =
    portalVariant === "internal"
      && primaryRole === ROLE_NAMES.HR
      ? { label: "Post New Job" }
      : null;

  const shellClassName = `fixed left-0 top-0 z-50 h-screen w-64 flex-col border-r border-[#2f3131] bg-[#1A1A1A]`;

  const brandTitleClassName = "text-[20px] font-bold leading-7 text-white";

  const brandSubtitleClassName =
    "text-[12px] font-semibold uppercase tracking-[0.05em] text-[#c8c6c5]";

  const userCardClassName =
    "flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3";

  const userNameClassName = "truncate text-[12px] font-semibold text-white";

  const userRoleClassName = "truncate text-[12px] text-[#c8c6c5]";

  const navLinkClassName = ({ isActive }: { isActive: boolean }) => {
    const common =
      "flex items-center gap-3 border-l-4 px-4 py-3 text-[12px] font-semibold tracking-[0.05em] transition-colors";

    return `${common} ${
      isActive
        ? "border-[#b90014] bg-white/5 text-white"
        : "border-transparent text-[#c8c6c5] hover:bg-white/5 hover:text-white"
    }`;
  };

  const bottomLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 text-[12px] font-semibold tracking-[0.05em] transition-colors ${
      isActive
        ? "text-white"
        : "text-[#c8c6c5] hover:text-white"
    }`;

  return (
    <aside className={` ${shellClassName} ${authState.isAuthenticated ? "flex" : "hidden"}`}>
      <div className="px-6 py-8">
        <NavLink to={resolvedBrand.to} className="block">
          <h1 className={brandTitleClassName}>{resolvedBrand.title}</h1>
          <p className={brandSubtitleClassName}>{resolvedBrand.subtitle}</p>
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {resolvedItems.map((item) => (
          <NavLink key={item.label} className={navLinkClassName} to={item.to}>
            <span className="material-symbols-outlined text-[20px]">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-6">
        {resolvedCta ? (
          <button
            type="button"
            className="mb-6 w-full rounded-none bg-[#e31b23] px-4 py-4 text-[16px] font-semibold text-white transition-colors hover:brightness-110"
            onClick={() => {
              navigate("/hr/jobs/create");
            }}
          >
            {resolvedCta.label}
          </button>
        ) : null}

        {resolvedBottomItems.length ? (
          <nav className="mb-6 space-y-1">
            {resolvedBottomItems.map((item) => (
              <NavLink key={item.label} className={bottomLinkClassName} to={item.to}>
                <span className="material-symbols-outlined text-[20px]">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            ))}
          </nav>
        ) : null}

        {showUserCard ? (
          <div className={userCardClassName}>
            {userAvatarSrc ? (
              <img
                alt={resolvedUserName}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-[#b90014]"
                src={userAvatarSrc}
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b90014] text-[12px] font-bold text-white">
                {resolvedInitials}
              </div>
            )}
            <div className="min-w-0">
              <p className={userNameClassName}>{resolvedUserName}</p>
              <p className={userRoleClassName}>{resolvedUserRole}</p>
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export default SideNavBar;
