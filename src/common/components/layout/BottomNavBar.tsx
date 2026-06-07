import { NavLink } from 'react-router-dom'

type BottomNavItem = {
  icon: string
  label: string
  to: string
}

const defaultItems: BottomNavItem[] = [
  { icon: 'home', label: 'Home', to: '/candidate/dashboard' },
  { icon: 'work', label: 'Jobs', to: '/jobs' },
  { icon: 'inbox', label: 'Applications', to: '/candidate/my-applications' },
  { icon: 'person', label: 'Profile', to: '/candidate/profile' },
]

function BottomNavBar() {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 rounded-[28px] border border-white/40 bg-[rgba(255,253,249,0.86)] shadow-[0_20px_50px_rgba(17,36,43,0.14)] backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-4">
        {defaultItems.map((item) => (
          <NavLink
            key={item.label}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 text-[11px] font-semibold transition-all ${
                isActive ? 'text-[var(--rp-primary)]' : 'text-[var(--rp-muted)]'
              }`
            }
            to={item.to}
          >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              {item.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNavBar
