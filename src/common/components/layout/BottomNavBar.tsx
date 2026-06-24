import { NavLink } from 'react-router-dom'

import { usePermissions } from '../../../hooks/usePermissions'

type BottomNavItem = {
  icon: string
  label: string
  to: string
}

const defaultItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'Tổng quan', to: '/candidate/dashboard' },
  { icon: 'work', label: 'Việc làm', to: '/jobs' },
  { icon: 'inbox', label: 'Đơn của tôi', to: '/candidate/my-applications' },
  { icon: 'event', label: 'Phỏng vấn', to: '/candidate/interviews' },
  { icon: 'person', label: 'Hồ sơ', to: '/candidate/profile' },
]

function BottomNavBar() {
  const { portalVariant } = usePermissions()

  if (portalVariant !== 'candidate') {
    return null
  }

  const items = defaultItems

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#ececec] bg-white/90 shadow-[0_-8px_30px_rgba(26,28,28,0.07)] backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div
        className="grid"
        style={{ gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))` }}
      >
        {items.map((item) => (
          <NavLink
            key={item.label}
            className={({ isActive }) =>
              `group relative flex flex-col items-center gap-1 pb-2 pt-2.5 text-[10.5px] font-semibold transition-colors ${
                isActive ? 'text-[#b90014]' : 'text-[#8a8786] hover:text-[#1a1c1c]'
              }`
            }
            to={item.to}
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute top-0 h-[3px] w-8 rounded-b-full bg-[#b90014] transition-all duration-200 ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <span
                  className={`flex h-7 items-center justify-center transition-transform duration-150 ${
                    isActive ? 'scale-105' : 'group-active:scale-95'
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[23px]"
                    style={
                      isActive
                        ? ({ fontVariationSettings: "'FILL' 1, 'wght' 500" } as React.CSSProperties)
                        : undefined
                    }
                  >
                    {item.icon}
                  </span>
                </span>
                <span className="leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNavBar
