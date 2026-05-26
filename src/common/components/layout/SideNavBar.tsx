import { NavLink } from 'react-router-dom'

type SideNavItem = {
  icon: string
  label: string
  to: string
}

type SideNavBarProps = {
  userName?: string
  userRole?: string
}

const defaultItems: SideNavItem[] = [
  { icon: 'dashboard', label: 'Dashboard', to: '/internal/dashboard' },
  { icon: 'work', label: 'Jobs', to: '/internal/jobs' },
  { icon: 'description', label: 'Applications', to: '/internal/applications' },
  { icon: 'analytics', label: 'Analytics', to: '/internal/analytics' },
  { icon: 'settings', label: 'Settings', to: '/internal/settings' },
  { icon: 'help', label: 'Support', to: '/internal/support' },
]

function SideNavBar({
  userName = 'Alex Rivera',
  userRole = 'Senior Recruiter',
}: SideNavBarProps) {
  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-[#2f3131] bg-[#1A1A1A] lg:flex">
      <div className="px-6 py-8">
        <NavLink to="/internal/jobs" className="block">
          <h1 className="text-[20px] font-bold leading-7 text-white">RecruitPro</h1>
          <p className="text-[12px] font-semibold uppercase tracking-[0.05em] text-[#c8c6c5]">
            Internal Portal
          </p>
        </NavLink>
      </div>

      <nav className="flex-1 space-y-1 px-2">
        {defaultItems.map((item) => {
          return (
            <NavLink
              key={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 border-l-4 px-4 py-3 text-[12px] font-semibold tracking-[0.05em] transition-colors ${
                  isActive
                    ? 'border-[#b90014] bg-white/5 text-white'
                    : 'border-transparent text-[#c8c6c5] hover:bg-white/5 hover:text-white'
                }`
              }
              to={item.to}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {item.label}
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto px-4 pb-6">
        <button
          type="button"
          className="mb-6 w-full rounded-lg bg-[#e31b23] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:brightness-110"
        >
          Post New Job
        </button>

        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-3 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#b90014] text-[12px] font-bold text-white">
            AR
          </div>
          <div className="min-w-0">
            <p className="truncate text-[12px] font-semibold text-white">{userName}</p>
            <p className="truncate text-[12px] text-[#c8c6c5]">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default SideNavBar
