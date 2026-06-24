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
  isOpen?: boolean;
  onClose?: () => void;
};

const hrItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Tổng quan",
    to: "/hr/dashboard",
  },
  {
    icon: "work",
    label: "Tin tuyển dụng",
    to: "/jobs",
  },
  {
    icon: "group",
    label: "Ứng viên",
    to: "/hr/candidates",
  },
  {
    icon: "description",
    label: "Hồ sơ ứng tuyển",
    to: "/hr/applications",
  },
  {
    icon: "smart_toy",
    label: "AI Copilot",
    to: "/hr/ai-copilot",
  },
  {
    icon: "schedule",
    label: "Phỏng vấn",
    to: "/hr/interviews",
  },
  {
    icon: "person",
    label: "Hồ sơ",
    to: "/internal/profile",
  },
];

const managerItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Tổng quan",
    to: "/manager/dashboard",
  },
  {
    icon: "approval",
    label: "Duyệt tuyển dụng",
    to: "/jobs",
  },
  {
    icon: "description",
    label: "Hồ sơ ứng tuyển",
    to: "/manager/applications",
  },
  {
    icon: "smart_toy",
    label: "AI Copilot",
    to: "/hr/ai-copilot",
  },
  {
    icon: "schedule",
    label: "Phỏng vấn",
    to: "/hr/interviews",
  },
  {
    icon: "analytics",
    label: "Báo cáo",
    to: "/manager/reports",
  },
  {
    icon: "person",
    label: "Hồ sơ",
    to: "/internal/profile",
  },
];

const headDepartmentItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Tổng quan",
    to: "/hr/dashboard",
  },
  {
    icon: "schedule",
    label: "Phỏng vấn",
    to: "/hr/interviews",
  },
  {
    icon: "person",
    label: "Hồ sơ",
    to: "/internal/profile",
  },
];

const adminItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Tổng quan",
    to: "/system-admin/dashboard",
  },
  {
    icon: "group",
    label: "Người dùng",
    to: "/system-admin/users",
  },
  {
    icon: "shield_person",
    label: "Vai trò",
    to: "/system-admin/roles",
  },
  {
    icon: "admin_panel_settings",
    label: "Quyền hạn",
    to: "/system-admin/permissions",
  },
  {
    icon: "history",
    label: "Nhật ký hệ thống",
    to: "/system-admin/audit-logs",
  },
];

const internalBottomItems: SideNavItem[] = [];

const candidateItems: SideNavItem[] = [
  {
    icon: "dashboard",
    label: "Tổng quan",
    to: "/candidate/dashboard",
  },
  {
    icon: "work",
    label: "Việc làm",
    to: "/jobs",
  },
  {
    icon: "description",
    label: "Đơn ứng tuyển",
    to: "/candidate/my-applications",
  },
  {
    icon: "schedule",
    label: "Phỏng vấn",
    to: "/candidate/interviews",
  },
  {
    icon: "person",
    label: "Hồ sơ",
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
      return "Ứng viên";
    case ROLE_NAMES.HR:
      return "HR";
    case ROLE_NAMES.HEAD_DEPARTMENT:
      return "Trưởng bộ phận";
    case ROLE_NAMES.MANAGER:
      return "Quản lý";
    case ROLE_NAMES.SYSTEM_ADMIN:
      return "Quản trị hệ thống";
    default:
      return "Người dùng nội bộ";
  }
}

function SideNavBar({
  showUserCard = true,
  userAvatarSrc,
  isOpen = false,
  onClose,
}: SideNavBarProps) {
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);
  const { defaultPath, portalVariant, primaryRole } = usePermissions();

  const authUser = authState.user;

  const internalItems =
    primaryRole === ROLE_NAMES.SYSTEM_ADMIN
      ? adminItems
      : primaryRole === ROLE_NAMES.HEAD_DEPARTMENT
        ? headDepartmentItems
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
        ? "Cổng ứng viên"
        : primaryRole === ROLE_NAMES.SYSTEM_ADMIN
          ? "Quản trị hệ thống"
          : primaryRole === ROLE_NAMES.HEAD_DEPARTMENT
            ? "Điều phối phỏng vấn"
          : primaryRole === ROLE_NAMES.MANAGER
            ? "Phê duyệt tuyển dụng"
            : "Vận hành tuyển dụng",
    to: defaultPath,
  };

  const resolvedUserName =
    authUser?.fullName ?? (portalVariant === "candidate" ? "Ứng viên" : "Người dùng nội bộ");
  const resolvedUserAvatarSrc = userAvatarSrc ?? authUser?.avatarUrl ?? undefined;
  const resolvedUserRole =
    portalVariant === "candidate"
      ? "Ứng viên"
      : formatRoleLabel(primaryRole);
  const resolvedInitials = resolvedUserName ? getInitials(resolvedUserName) : "";

  const resolvedCta =
    portalVariant === "internal"
      && primaryRole === ROLE_NAMES.HR
      ? { label: "Đăng tin mới" }
      : null;

  const shellClassName = `fixed left-0 top-0 z-50 h-screen w-64 flex-col border-r border-white/10 bg-[#18191a] shadow-[18px_0_60px_rgba(26,28,28,0.18)] transition-transform duration-200 ease-out`;

  const brandTitleClassName = "text-[20px] font-bold leading-7 text-white";

  const brandSubtitleClassName =
    "text-[12px] font-semibold uppercase tracking-[0.05em] text-[#c8c6c5]";

  const userCardClassName =
    "flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.06] px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]";

  const userNameClassName = "truncate text-[12px] font-semibold text-white";

  const userRoleClassName = "truncate text-[12px] text-[#c8c6c5]";

  const navLinkClassName = ({ isActive }: { isActive: boolean }) => {
    const common =
      "group flex items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-[12px] font-semibold tracking-[0.03em] transition-all duration-150";

    return `${common} ${
      isActive
        ? "border-white/10 bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        : "text-[#c8c6c5] hover:border-white/10 hover:bg-white/[0.05] hover:text-white"
    }`;
  };

  const bottomLinkClassName = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-3 text-[12px] font-semibold tracking-[0.05em] transition-colors ${
      isActive
        ? "text-white"
        : "text-[#c8c6c5] hover:text-white"
    }`;

  return (
    <aside className={`${shellClassName} ${authState.isAuthenticated ? "flex" : "hidden"} ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
      <div className="flex items-start justify-between px-6 pb-6 pt-8">
        <NavLink to={resolvedBrand.to} className="block" onClick={onClose}>
          <h1 className={brandTitleClassName}>{resolvedBrand.title}</h1>
          <p className={brandSubtitleClassName}>{resolvedBrand.subtitle}</p>
        </NavLink>
        {onClose ? (
          <button
            type="button"
            className="mt-1 text-[#c8c6c5] transition-colors hover:text-white lg:hidden"
            aria-label="Đóng menu"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {resolvedItems.map((item) => (
          <NavLink key={item.label} className={navLinkClassName} to={item.to} onClick={onClose}>
            <span className="material-symbols-outlined text-[20px] transition-transform duration-150 group-hover:scale-105">
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
            className="premium-action mb-6 w-full rounded-lg bg-[#e31b23] px-4 py-3 text-[14px] font-semibold text-white shadow-[0_12px_30px_rgba(227,27,35,0.22)] transition-colors hover:bg-[#b90014]"
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
            {resolvedUserAvatarSrc ? (
              <img
                alt={resolvedUserName}
                className="h-10 w-10 rounded-full object-cover ring-2 ring-[#b90014]"
                src={resolvedUserAvatarSrc}
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
