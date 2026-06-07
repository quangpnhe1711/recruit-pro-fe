import { useSelector } from "react-redux";

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
  { label: "Settings", to: "/settings" },
];

function AppHeader({
  showNotifications = true,
  menuItems,
}: AppHeaderProps) {
  const authUser = useSelector((state: RootState) => state.auth.user);
  const variant =
    useSelector((state: RootState) => state.auth.currentVariant) ?? "candidate";

  const userName = authUser?.fullName ?? "No user";
  const userRole =
    authUser?.roles?.[0] ??
    (variant === "candidate" ? "Candidate" : "Internal User");
  const portalLabel =
    variant === "candidate" ? "Candidate workspace" : "Internal operations";
  const avatarSrc = authUser?.avatarUrl ?? undefined;
  const resolvedInitials = getInitials(userName);
  const resolvedMenuItems =
    menuItems ??
    (variant === "candidate"
      ? defaultMenuItems
      : [
          { label: "Profile", to: "/internal/profile" },
          { label: "Settings", to: "/settings" },
        ]);

  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-[rgba(247,242,234,0.62)] backdrop-blur-xl">
      <div className="page-shell flex h-20 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[24px] font-extrabold tracking-[-0.08em] text-[var(--rp-text)]">
            RecruitPro
          </p>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--rp-muted)]">
            {portalLabel}
          </p>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {showNotifications ? (
            <div className="hidden items-center gap-4 border-r border-[rgba(24,33,38,0.08)] pr-6 md:flex">
              <button
                className="glass-surface rounded-full p-3 text-[var(--rp-muted)] hover:text-[var(--rp-primary)]"
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
