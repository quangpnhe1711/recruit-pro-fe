import { NavLink } from 'react-router-dom'

import { usePermissions } from '../../../hooks/usePermissions'

type BottomNavItem = {
  icon: string
  label: string
  to: string
}

const defaultItems: BottomNavItem[] = [
  {
    icon: 'dashboard',
    label: 'Tổng quan',
    to: '/candidate/dashboard',
  },
  {
    icon: 'work',
    label: 'Việc làm',
    to: '/jobs',
  },
  {
    icon: 'inbox',
    label: 'Đơn ứng tuyển',
    to: '/candidate/my-applications',
  },
  {
    icon: 'schedule',
    label: 'Phỏng vấn',
    to: '/candidate/interviews',
  },
  {
    icon: 'person',
    label: 'Hồ sơ',
    to: '/candidate/profile',
  },
]

function BottomNavBar() {
  const { portalVariant } = usePermissions()

  if (portalVariant !== 'candidate') {
    return null
  }

  const items = defaultItems

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e2dfde] bg-white/95 backdrop-blur lg:hidden">
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
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
