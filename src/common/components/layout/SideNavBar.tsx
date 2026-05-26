import { NavLink } from "react-router-dom";

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

type SideNavCta = {
  label: string;
  onClick?: () => void;
};

type SideNavBarProps = {
  variant?: "internal" | "candidate";
  items?: SideNavItem[];
  bottomItems?: SideNavItem[];
  brand?: SideNavBrand;
  cta?: SideNavCta | null;
  showUserCard?: boolean;
  userName?: string;
  userRole?: string;
  userAvatarSrc?: string;
  initials?: string;
  /** @deprecated NavLink already handles active state */
  activeKey?: string;
};

const internalItems: SideNavItem[] = [
  { icon: "dashboard", label: "Dashboard", to: "/internal/dashboard" },
  { icon: "work", label: "Jobs", to: "/internal/jobs" },
  { icon: "description", label: "Applications", to: "/internal/applications" },
  { icon: "analytics", label: "Analytics", to: "/internal/analytics" },
];

const internalBottomItems: SideNavItem[] = [
  { icon: "settings", label: "Settings", to: "/internal/settings" },
  { icon: "help", label: "Support", to: "/internal/support" },
];

const candidateItems: SideNavItem[] = [
  { icon: "dashboard", label: "Dashboard", to: "/candidate/dashboard" },
  { icon: "work", label: "Jobs", to: "/candidate/jobs" },
  {
    icon: "description",
    label: "My Applications",
    to: "/candidate/my-applications",
  },
  { icon: "analytics", label: "Analytics", to: "/candidate/dashboard#analytics" },
];

const candidateBottomItems: SideNavItem[] = [
  { icon: "settings", label: "Settings", to: "/candidate/settings" },
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
  variant = "internal",
  items,
  bottomItems,
  brand,
  cta,
  showUserCard = true,
  userName,
  userRole,
  userAvatarSrc,
  initials,
}: SideNavBarProps) {
  const resolvedItems =
    items ?? (variant === "candidate" ? candidateItems : internalItems);

  const resolvedBottomItems =
    bottomItems ??
    (variant === "candidate" ? candidateBottomItems : internalBottomItems);

  const resolvedBrand = {
    title: brand?.title ?? "RecruitPro",
    subtitle:
      brand?.subtitle ??
      (variant === "candidate" ? "Candidate Portal" : "Internal Portal"),
    to:
      brand?.to ?? (variant === "candidate" ? "/candidate" : "/internal/jobs"),
  };

  const resolvedUserName =
    userName ?? (variant === "candidate" ? "Alex Thompson" : "Alex Rivera");
  const resolvedUserRole =
    userRole ??
    (variant === "candidate" ? "Senior Candidate" : "Senior Recruiter");

  const resolvedInitials =
    initials ??
    (resolvedUserName ? getInitials(resolvedUserName) : "");

  const resolvedCta =
    cta !== undefined
      ? cta
      : variant === "internal"
        ? { label: "Post New Job" }
        : null;

  const shellClassName =
    "fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-[#2f3131] bg-[#1A1A1A] lg:flex";

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
    <aside className={shellClassName}>
      <div className="px-6 py-8">
        <NavLink to={resolvedBrand.to} className="block">
          <h1 className={brandTitleClassName}>{resolvedBrand.title}</h1>
          <p className={brandSubtitleClassName}>{resolvedBrand.subtitle}</p>
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {resolvedItems.map((item) => (
          <NavLink
            key={item.label}
            className={navLinkClassName}
            to={item.to}
            end={item.to === "/candidate"}
          >
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
            onClick={resolvedCta.onClick}
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
