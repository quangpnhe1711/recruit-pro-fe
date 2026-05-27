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
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e2dfde] bg-white/95 backdrop-blur lg:hidden">
      <div className="grid grid-cols-4">
        {defaultItems.map((item) => (
          <NavLink
            key={item.label}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 py-3 text-[12px] font-semibold transition-colors ${
                isActive ? 'text-[#b90014]' : 'text-[#5f5e5e]'
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
