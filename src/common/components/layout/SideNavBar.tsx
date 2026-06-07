import { NavLink } from "react-router-dom";
import { RootState } from "../../../store";
import { useSelector } from "react-redux";

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

const internalItems: SideNavItem[] = [
  { icon: "dashboard", label: "Dashboard", to: "/hr/dashboard" },
  { icon: "work", label: "Jobs", to: "/jobs" },
  { icon: "group", label: "Candidates", to: "/hr/candidates" },
  { icon: "description", label: "Applications", to: "/hr/applications" },
  { icon: "event", label: "Interviews", to: "/hr/interviews" },
];

const internalBottomItems: SideNavItem[] = [
  { icon: "help", label: "Support", to: "/internal/support" },
];

const candidateItems: SideNavItem[] = [
  { icon: "dashboard", label: "Dashboard", to: "/candidate/dashboard" },
  { icon: "work", label: "Jobs", to: "/jobs" },
  { icon: "description", label: "My Applications", to: "/candidate/my-applications" },
];

const candidateBottomItems: SideNavItem[] = [
  { icon: "help", label: "Support", to: "/candidate/support" },
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

function SideNavBar({
  showUserCard = true,
  userAvatarSrc,
}: SideNavBarProps) {
  const authState = useSelector((state: RootState) => state.auth);

  const resolvedVariant = authState?.currentVariant ?? "candidate";
  const authUser = authState.user;

  const resolvedItems =
    resolvedVariant === "candidate" ? candidateItems : internalItems;

  const resolvedBottomItems =
    resolvedVariant === "candidate" ? candidateBottomItems : internalBottomItems;

  const resolvedBrand = {
    title: "RecruitPro",
    subtitle:
      resolvedVariant === "candidate" ? "Candidate Portal" : "Internal Portal",
    to:
      resolvedVariant === "candidate"
        ? "/candidate/dashboard"
        : "/hr/dashboard",
  };

  const resolvedUserName =
    authUser?.fullName ?? (resolvedVariant === "candidate" ? "Candidate" : "Internal User");
  const resolvedUserRole =
    authUser?.roles?.[0] ?? (resolvedVariant === "candidate" ? "Candidate" : "Internal User");
  const resolvedInitials = resolvedUserName ? getInitials(resolvedUserName) : "";

  const resolvedCta =
    resolvedVariant === "internal"
      ? { label: "Post New Job", to: "/hr/jobs/create" }
      : null;

  const navLinkClassName = ({ isActive }: { isActive: boolean }) => {
    const common =
      "inline-flex items-center gap-2 rounded-full px-4 py-3 text-[12px] font-semibold tracking-[0.08em] transition-all duration-200 whitespace-nowrap";

    return `${common} ${
      isActive
        ? "bg-[var(--rp-text)] text-white shadow-[0_14px_30px_rgba(17,36,43,0.18)]"
        : "bg-white/55 text-[var(--rp-muted)] hover:bg-white hover:text-[var(--rp-text)]"
    }`;
  };

  return (
    <aside className={`${authState.isAuthenticated ? "block" : "hidden"} sticky top-20 z-30`}>
      <div className="border-b border-white/35 bg-[rgba(247,242,234,0.78)] backdrop-blur-xl">
        <div className="page-shell flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <NavLink
              to={resolvedBrand.to}
              className="hidden rounded-full bg-[rgba(17,36,43,0.92)] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.16em] text-white lg:inline-flex"
            >
              {resolvedBrand.subtitle}
            </NavLink>

            <nav className="scrollbar-hide flex min-w-0 flex-1 items-center gap-3 overflow-x-auto">
              {resolvedItems.map((item) => (
                <NavLink key={item.label} className={navLinkClassName} to={item.to}>
                  <span className="material-symbols-outlined text-[18px]">
                    {item.icon}
                  </span>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center justify-between gap-3 lg:justify-end">
            {resolvedBottomItems.length ? (
              <nav className="hidden items-center gap-2 xl:flex">
                {resolvedBottomItems.map((item) => (
                  <NavLink
                    key={item.label}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[12px] font-semibold tracking-[0.08em] text-[var(--rp-muted)] hover:bg-white/70 hover:text-[var(--rp-text)]"
                    to={item.to}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {item.icon}
                    </span>
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            ) : null}

            {resolvedCta ? (
              <NavLink
                to={resolvedCta.to}
                className="btn-primary px-5 py-3 text-[12px] font-semibold tracking-[0.08em]"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                {resolvedCta.label}
              </NavLink>
            ) : null}

            {showUserCard ? (
              <div className="hidden items-center gap-3 rounded-full border border-white/40 bg-white/62 px-3 py-2 shadow-[0_16px_34px_rgba(17,36,43,0.08)] xl:flex">
                {userAvatarSrc ? (
                  <img
                    alt={resolvedUserName}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-[var(--rp-primary)]"
                    src={userAvatarSrc}
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--rp-primary)] text-[12px] font-bold text-white">
                    {resolvedInitials}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-semibold text-[var(--rp-text)]">
                    {resolvedUserName}
                  </p>
                  <p className="truncate text-[12px] text-[var(--rp-muted)]">
                    {resolvedUserRole}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

export default SideNavBar;
