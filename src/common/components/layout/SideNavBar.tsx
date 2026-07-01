import { NavLink, useNavigate } from "react-router-dom";
import { RootState } from "../../../store";
import { useSelector } from "react-redux";
import { usePermissions } from "../../../hooks/usePermissions";
import { ROLE_NAMES } from "../../../permissions/rolePermissions";

export type SideNavItem = {
  icon: string;
  label: string;
  to: string;
  /** Optional group header this item belongs to (rendered once per group). */
  section?: string;
  /** Exact-match active highlight (NavLink `end`) — use for a group's overview route. */
  end?: boolean;
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
  /** When true, the sidebar is desktop-only (never shown as a mobile drawer). */
  desktopOnly?: boolean;
};

const hrItems: SideNavItem[] = [
  { icon: "dashboard", label: "Tổng quan", to: "/hr/dashboard" },
  { icon: "work", label: "Tin tuyển dụng", to: "/jobs" },
  { icon: "group", label: "Ứng viên", to: "/hr/candidates" },
  { icon: "description", label: "Hồ sơ ứng tuyển", to: "/hr/applications" },
  { icon: "smart_toy", label: "AI Copilot", to: "/hr/ai-copilot" },
  { icon: "schedule", label: "Phỏng vấn", to: "/hr/interviews" },
  { icon: "person", label: "Hồ sơ", to: "/internal/profile" },
];

const managerItems: SideNavItem[] = [
  { icon: "dashboard", label: "Tổng quan", to: "/manager/dashboard" },
  { icon: "approval", label: "Duyệt tuyển dụng", to: "/jobs" },
  { icon: "description", label: "Hồ sơ ứng tuyển", to: "/manager/applications" },
  { icon: "smart_toy", label: "AI Copilot", to: "/hr/ai-copilot" },
  { icon: "schedule", label: "Phỏng vấn", to: "/hr/interviews" },
  { icon: "analytics", label: "Báo cáo", to: "/manager/reports" },
  { icon: "person", label: "Hồ sơ", to: "/internal/profile" },
];

const headDepartmentItems: SideNavItem[] = [
  { icon: "dashboard", label: "Tổng quan", to: "/hr/dashboard" },
  { icon: "approval", label: "Duyệt tin tuyển dụng", to: "/jobs" },
  { icon: "schedule", label: "Phỏng vấn", to: "/hr/interviews" },
  { icon: "person", label: "Hồ sơ", to: "/internal/profile" },
];

const adminItems: SideNavItem[] = [
  // Automation is the product value → its own clear group, business labels.
  { section: "Tự động hóa tuyển dụng", icon: "space_dashboard", label: "Tổng quan", to: "/system-admin/automation", end: true },
  { section: "Tự động hóa tuyển dụng", icon: "account_tree", label: "Workflows", to: "/system-admin/automation/workflows" },
  { section: "Tự động hóa tuyển dụng", icon: "play_circle", label: "Lịch sử chạy", to: "/system-admin/automation/executions" },
  { section: "Tự động hóa tuyển dụng", icon: "bolt", label: "Sự kiện", to: "/system-admin/automation/events" },
  { section: "Tự động hóa tuyển dụng", icon: "troubleshoot", label: "Chẩn đoán", to: "/system-admin/automation/diagnostics" },
  // MCP is advanced/internal tooling, not the main product.
  { section: "Công cụ nội bộ", icon: "hub", label: "MCP Tools", to: "/system-admin/mcp/tools" },
  { section: "Công cụ nội bộ", icon: "receipt_long", label: "MCP Audit", to: "/system-admin/mcp/audits" },
  { section: "Quản trị hệ thống", icon: "group", label: "Người dùng", to: "/system-admin/users" },
  { section: "Quản trị hệ thống", icon: "shield_person", label: "Vai trò", to: "/system-admin/roles" },
  { section: "Quản trị hệ thống", icon: "admin_panel_settings", label: "Quyền hạn", to: "/system-admin/permissions" },
  { section: "Quản trị hệ thống", icon: "history", label: "Nhật ký hệ thống", to: "/system-admin/audit-logs" },
];

const candidateItems: SideNavItem[] = [
  { icon: "dashboard", label: "Tổng quan", to: "/candidate/dashboard" },
  { icon: "work", label: "Việc làm", to: "/jobs" },
  { icon: "description", label: "Đơn ứng tuyển", to: "/candidate/my-applications" },
  { icon: "schedule", label: "Phỏng vấn", to: "/candidate/interviews" },
  { icon: "person", label: "Hồ sơ", to: "/candidate/profile" },
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
  desktopOnly = false,
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

  const resolvedBrand = {
    title: "RecruitPro",
    subtitle:
      portalVariant === "candidate"
        ? "Cổng ứng viên"
        : primaryRole === ROLE_NAMES.SYSTEM_ADMIN
          ? "Quản trị hệ thống"
          : primaryRole === ROLE_NAMES.HEAD_DEPARTMENT
            ? "Trưởng bộ phận duyệt tin"
            : primaryRole === ROLE_NAMES.MANAGER
              ? "Phê duyệt tuyển dụng"
              : "Vận hành tuyển dụng",
    to: defaultPath,
  };

  const resolvedUserName =
    authUser?.fullName ??
    (portalVariant === "candidate" ? "Ứng viên" : "Người dùng nội bộ");
  const resolvedUserAvatarSrc = userAvatarSrc ?? authUser?.avatarUrl ?? undefined;
  const resolvedUserRole =
    portalVariant === "candidate" ? "Ứng viên" : formatRoleLabel(primaryRole);
  const resolvedInitials = resolvedUserName ? getInitials(resolvedUserName) : "";

  const resolvedCta =
    portalVariant === "internal" && primaryRole === ROLE_NAMES.HR
      ? { label: "Đăng tin mới" }
      : null;

  const visibilityClass = desktopOnly
    ? "hidden lg:flex lg:translate-x-0"
    : `flex ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`;

  const navLinkClassName = ({ isActive }: { isActive: boolean }) => {
    const common =
      "group relative flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-medium transition-all duration-150";

    return `${common} ${
      isActive
        ? "bg-white/[0.09] text-white"
        : "text-[#b9b6b5] hover:bg-white/[0.05] hover:text-white"
    }`;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-screen w-[260px] flex-col bg-[#161718] shadow-[12px_0_48px_rgba(26,28,28,0.16)] transition-transform duration-300 ease-out ${
        authState.isAuthenticated ? "" : "hidden"
      } ${visibilityClass}`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-5 pb-5 pt-6">
        <NavLink to={resolvedBrand.to} className="flex items-center gap-3" onClick={onClose}>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#f0353d] to-[#b90014] text-white shadow-[0_8px_20px_-6px_rgba(227,27,35,0.6)]">
            <span className="material-symbols-outlined text-[22px]">hub</span>
          </span>
          <span className="leading-tight">
            <span className="block text-[17px] font-bold tracking-[-0.01em] text-white">
              {resolvedBrand.title}
            </span>
            <span className="block text-[11px] font-medium text-[#8a8786]">
              {resolvedBrand.subtitle}
            </span>
          </span>
        </NavLink>
        {!desktopOnly && onClose ? (
          <button
            type="button"
            className="premium-action -mr-1 text-[#b9b6b5] transition-colors hover:text-white lg:hidden"
            aria-label="Đóng menu"
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        ) : null}
      </div>

      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Primary nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        {resolvedItems.map((item, index) => {
          const previousSection = index > 0 ? resolvedItems[index - 1].section : undefined;
          const sectionHeader =
            index === 0 ? (item.section ?? "Điều hướng") : item.section !== previousSection ? item.section : undefined;
          return (
          <div key={item.label}>
          {sectionHeader ? (
            <p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6f6b6a] ${index === 0 ? "" : "pt-4"}`}>
              {sectionHeader}
            </p>
          ) : null}
          <NavLink
            className={navLinkClassName}
            to={item.to}
            onClick={onClose}
            end={item.end ?? item.to === resolvedBrand.to}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[#f0353d] transition-opacity duration-150 ${
                    isActive ? "opacity-100" : "opacity-0"
                  }`}
                />
                <span
                  className={`material-symbols-outlined text-[21px] transition-transform duration-150 group-hover:scale-105 ${
                    isActive ? "text-white" : "text-[#9a9695]"
                  }`}
                >
                  {item.icon}
                </span>
                {item.label}
              </>
            )}
          </NavLink>
          </div>
          );
        })}
      </nav>

      {/* Footer area */}
      <div className="mt-auto px-4 pb-5">
        {resolvedCta ? (
          <button
            type="button"
            className="premium-action mb-4 flex w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-b from-[#e8242c] to-[#c50f1b] px-4 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(227,27,35,0.5)] transition-all hover:from-[#f0353d] hover:to-[#d11420]"
            onClick={() => {
              onClose?.();
              navigate("/hr/jobs/create");
            }}
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {resolvedCta.label}
          </button>
        ) : null}

        {showUserCard ? (
          <NavLink
            to="/internal/profile"
            onClick={onClose}
            className="flex items-center gap-3 rounded-[12px] border border-white/[0.07] bg-white/[0.04] px-3 py-2.5 transition-colors hover:bg-white/[0.07]"
          >
            {resolvedUserAvatarSrc ? (
              <img
                alt={resolvedUserName}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10"
                src={resolvedUserAvatarSrc}
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#f0353d] to-[#b90014] text-[12px] font-bold text-white">
                {resolvedInitials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">
                {resolvedUserName}
              </p>
              <p className="truncate text-[11px] text-[#8a8786]">{resolvedUserRole}</p>
            </div>
            <span className="material-symbols-outlined text-[18px] text-[#6f6b6a]">
              chevron_right
            </span>
          </NavLink>
        ) : null}
      </div>
    </aside>
  );
}

export default SideNavBar;
