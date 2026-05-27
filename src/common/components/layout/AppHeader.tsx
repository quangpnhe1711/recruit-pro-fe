import HeaderAvatarDropDown from "../../../pages/internal/HeaderAvatarDropDown";

export type AppHeaderMenuItem = {
  label: string;
  to: string;
};

type AppHeaderProps = {
  userName?: string;
  userRole?: string;
  avatarSrc?: string;
  initials?: string;
  showNotifications?: boolean;
  menuItems?: AppHeaderMenuItem[];
  logoutTo?: string;
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
  userName = "Alex Rivera",
  userRole = "Senior Recruiter",
  avatarSrc,
  initials,
  showNotifications = true,
  menuItems = defaultMenuItems,
  logoutTo = "/logout",
}: AppHeaderProps) {
  const resolvedInitials = initials ?? getInitials(userName);

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
              items={menuItems}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default AppHeader;
