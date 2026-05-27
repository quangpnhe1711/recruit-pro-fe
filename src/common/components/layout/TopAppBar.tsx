import { Link } from "react-router-dom";

type TopNavItem = {
  label: string;
  href: string;
  active?: boolean;
};

type TopAppBarProps = {
  navItems?: TopNavItem[];
};

const defaultNavItems: TopNavItem[] = [
  { label: "Home", href: "/", active: true },
  { label: "Jobs", href: "#jobs" },
  { label: "About Us", href: "#about" },
];

function TopAppBar({ navItems = defaultNavItems }: TopAppBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e2dfde] bg-white">
      <div className="mx-auto grid h-16 max-w-[1440px] grid-cols-3 items-center px-4 md:px-10">
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <a
              key={item.label}
              className={`text-[12px] font-semibold tracking-[0.05em] transition-colors ${
                item.active
                  ? "border-b-2 border-[#b90014] pb-1 text-[#b90014]"
                  : "text-[#5f5e5e] hover:text-[#b90014]"
              }`}
              href={item.href}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="justify-self-center">
          <Link
            className="text-[24px] font-extrabold tracking-[-0.02em] text-[#b90014] md:text-[30px]"
            to="/"
          >
            RecruitPro
          </Link>
        </div>

        <div className="flex items-center justify-end gap-4 md:gap-6">
          <div className="hidden items-center gap-4 md:flex">
            <button
              type="button"
              className="text-[#5f5e5e] transition-colors hover:text-[#b90014]"
            >
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button
              type="button"
              className="text-[#5f5e5e] transition-colors hover:text-[#b90014]"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>
          </div>
          <Link
            className="rounded-none border-2 border-[#b90014] px-4 py-2 text-[12px] font-semibold text-[#b90014] transition-colors hover:bg-[#b90014] hover:text-white"
            to="/login"
          >
            Log in
          </Link>
        </div>
      </div>
    </header>
  );
}

export default TopAppBar;
