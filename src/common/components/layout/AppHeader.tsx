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
