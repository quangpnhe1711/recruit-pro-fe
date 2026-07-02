import { NavLink, useNavigate } from "react-router-dom";
import { RootState } from "../../../store";
import { useSelector } from "react-redux";
import { usePermissions } from "../../../hooks/usePermissions";
import { ROLE_NAMES } from "../../../permissions/rolePermissions";
import { useI18n } from "../../../i18n";
import BrandLogo from "./BrandLogo";

export type SideNavItem = {
  icon: string;
  /** i18n key under `nav.` for the item label. */
  label: string;
  to: string;
  /** Optional i18n key (under `nav.`) of the group header this item belongs to. */
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
  { icon: "dashboard", label: "nav.dashboard", to: "/hr/dashboard" },
  { icon: "work", label: "nav.jobs", to: "/jobs" },
  { icon: "group", label: "nav.candidates", to: "/hr/candidates" },
  { icon: "description", label: "nav.applications", to: "/hr/applications" },
  { icon: "smart_toy", label: "nav.aiCopilot", to: "/hr/ai-copilot" },
  { icon: "schedule", label: "nav.interviews", to: "/hr/interviews" },
  { icon: "person", label: "nav.profile", to: "/internal/profile" },
];

const managerItems: SideNavItem[] = [
  { icon: "dashboard", label: "nav.dashboard", to: "/manager/dashboard" },
  { icon: "approval", label: "nav.recruitmentApproval", to: "/jobs" },
  { icon: "description", label: "nav.applications", to: "/manager/applications" },
  { icon: "smart_toy", label: "nav.aiCopilot", to: "/hr/ai-copilot" },
  { icon: "schedule", label: "nav.interviews", to: "/hr/interviews" },
  { icon: "analytics", label: "nav.reports", to: "/manager/reports" },
  { icon: "person", label: "nav.profile", to: "/internal/profile" },
];

const headDepartmentItems: SideNavItem[] = [
  { icon: "dashboard", label: "nav.dashboard", to: "/hr/dashboard" },
  { icon: "approval", label: "nav.jobApproval", to: "/jobs" },
  { icon: "schedule", label: "nav.interviews", to: "/hr/interviews" },
  { icon: "person", label: "nav.profile", to: "/internal/profile" },
];

const adminItems: SideNavItem[] = [
  // Automation is the product value → its own clear group, business labels.
  { section: "nav.automationSection", icon: "space_dashboard", label: "nav.automationOverview", to: "/system-admin/automation", end: true },
  { section: "nav.automationSection", icon: "account_tree", label: "nav.workflows", to: "/system-admin/automation/workflows" },
  { section: "nav.automationSection", icon: "play_circle", label: "nav.executions", to: "/system-admin/automation/executions" },
  { section: "nav.automationSection", icon: "bolt", label: "nav.events", to: "/system-admin/automation/events" },
  { section: "nav.automationSection", icon: "troubleshoot", label: "nav.diagnostics", to: "/system-admin/automation/diagnostics" },
  // MCP is advanced/internal tooling, not the main product.
  { section: "nav.internalToolsSection", icon: "hub", label: "nav.mcpTools", to: "/system-admin/mcp/tools" },
  { section: "nav.internalToolsSection", icon: "receipt_long", label: "nav.mcpAudit", to: "/system-admin/mcp/audits" },
  { section: "nav.systemSection", icon: "group", label: "nav.users", to: "/system-admin/users" },
  { section: "nav.systemSection", icon: "shield_person", label: "nav.roles", to: "/system-admin/roles" },
  { section: "nav.systemSection", icon: "admin_panel_settings", label: "nav.permissions", to: "/system-admin/permissions" },
  { section: "nav.systemSection", icon: "history", label: "nav.auditLogs", to: "/system-admin/audit-logs" },
];

const candidateItems: SideNavItem[] = [
  { icon: "dashboard", label: "nav.dashboard", to: "/candidate/dashboard" },
  { icon: "work", label: "nav.findJobs", to: "/jobs" },
  { icon: "description", label: "nav.myApplications", to: "/candidate/my-applications" },
  { icon: "schedule", label: "nav.interviews", to: "/candidate/interviews" },
  { icon: "person", label: "nav.profile", to: "/candidate/profile" },
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

function roleLabelKey(role: string | null | undefined) {
  switch (role) {
    case ROLE_NAMES.CANDIDATE:
      return "roles.candidate";
    case ROLE_NAMES.HR:
      return "roles.hr";
    case ROLE_NAMES.HEAD_DEPARTMENT:
      return "roles.headDepartment";
    case ROLE_NAMES.MANAGER:
      return "roles.manager";
    case ROLE_NAMES.SYSTEM_ADMIN:
      return "roles.systemAdmin";
    default:
      return "roles.internalUser";
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
  const { t } = useI18n();

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
        ? t("brand.candidatePortal")
        : primaryRole === ROLE_NAMES.SYSTEM_ADMIN
          ? t("brand.systemAdmin")
          : primaryRole === ROLE_NAMES.HEAD_DEPARTMENT
            ? t("brand.headDepartment")
            : primaryRole === ROLE_NAMES.MANAGER
              ? t("brand.manager")
              : t("brand.hr"),
    to: defaultPath,
  };

  const resolvedUserName =
    authUser?.fullName ??
    (portalVariant === "candidate" ? t("roles.candidate") : t("roles.internalUser"));
  const resolvedUserAvatarSrc = userAvatarSrc ?? authUser?.avatarUrl ?? undefined;
  const resolvedUserRole =
    portalVariant === "candidate" ? t("roles.candidate") : t(roleLabelKey(primaryRole));
  const resolvedInitials = resolvedUserName ? getInitials(resolvedUserName) : "";
  const isSystemAdmin = primaryRole === ROLE_NAMES.SYSTEM_ADMIN;

  const resolvedCta =
    portalVariant === "internal" && primaryRole === ROLE_NAMES.HR
      ? { label: t("nav.postJob") }
      : null;

  const visibilityClass = desktopOnly
    ? "hidden lg:flex lg:translate-x-0"
    : `flex ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`;

  const navLinkClassName = ({ isActive }: { isActive: boolean }) => {
    const common =
      "group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-[13px] font-medium transition-all duration-150";

    return `${common} ${
      isSystemAdmin
        ? isActive
          ? "bg-[#2a1719] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
          : "text-[#a9a19d] hover:bg-white/[0.055] hover:text-white"
        : isActive
          ? "bg-white/[0.09] text-white"
          : "text-[#b9b6b5] hover:bg-white/[0.05] hover:text-white"
    }`;
  };

  return (
    <aside
      className={`fixed left-0 top-0 z-[70] h-screen flex-col transition-transform duration-300 ease-out ${
        isSystemAdmin
          ? "w-[286px] border-r border-white/[0.08] bg-[#121313] shadow-[18px_0_64px_rgba(18,19,19,0.28)]"
          : "w-[260px] bg-[#161718] shadow-[12px_0_48px_rgba(26,28,28,0.16)]"
      } ${
        authState.isAuthenticated ? "" : "hidden"
      } ${visibilityClass}`}
    >
      {/* Brand */}
      <div
        className={`flex items-center justify-between ${
          isSystemAdmin ? "px-5 pb-5 pt-5" : "px-5 pb-5 pt-6"
        }`}
      >
        <NavLink to={resolvedBrand.to} className="flex items-center gap-3" onClick={onClose}>
          <BrandLogo
            size="lg"
            subtitle={resolvedBrand.subtitle}
            subtitleClassName="text-[#9c9490]"
            titleClassName="text-white"
          />
        </NavLink>
        {!desktopOnly && onClose ? (
          <button
            type="button"
            className="premium-action -mr-1 text-[#b9b6b5] transition-colors hover:text-white lg:hidden"
            aria-label={t("nav.closeMenu")}
            onClick={onClose}
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        ) : null}
      </div>

      {isSystemAdmin ? (
        <div className="mx-4 mb-3 rounded-[14px] border border-white/[0.07] bg-white/[0.035] px-3.5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7d7672]">
                {t("nav.adminConsole")}
              </p>
              <p className="mt-1 text-[13px] font-semibold text-[#f5efed]">
                {t("brand.systemAdmin")}
              </p>
            </div>
            <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#2a1a1c] text-[#ffdad6]">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </span>
          </div>
        </div>
      ) : null}

      <div className="mx-5 h-px bg-white/[0.06]" />

      {/* Primary nav */}
      <nav
        className={`flex-1 space-y-1 overflow-y-auto scrollbar-hide ${
          isSystemAdmin ? "px-3 pb-4 pt-2" : "px-3 py-4"
        }`}
      >
        {resolvedItems.map((item, index) => {
          const previousSection = index > 0 ? resolvedItems[index - 1].section : undefined;
          const sectionHeader =
            index === 0 ? item.section : item.section !== previousSection ? item.section : undefined;
          return (
          <div key={item.label}>
          {sectionHeader ? (
            <p className={`px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] ${
              isSystemAdmin ? "text-[#756c68]" : "text-[#6f6b6a]"
            } ${index === 0 ? "" : "pt-4"}`}>
              {t(sectionHeader)}
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
                    isActive ? "text-[#ffdad6]" : "text-[#8f8580]"
                  }`}
                >
                  {item.icon}
                </span>
                {t(item.label)}
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
