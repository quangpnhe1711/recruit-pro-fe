import { NavLink } from 'react-router-dom'

import { usePermissions } from '../../../hooks/usePermissions'
import { ROLE_NAMES } from '../../../permissions/rolePermissions'

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

const hrItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'Tổng quan', to: '/hr/dashboard' },
  { icon: 'work', label: 'Jobs', to: '/jobs' },
  { icon: 'group', label: 'Ứng viên', to: '/hr/candidates' },
  { icon: 'smart_toy', label: 'AI', to: '/hr/ai-copilot' },
  { icon: 'schedule', label: 'Phỏng vấn', to: '/hr/interviews' },
]

const managerItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'Tổng quan', to: '/manager/dashboard' },
  { icon: 'approval', label: 'Duyệt job', to: '/jobs' },
  { icon: 'description', label: 'Hồ sơ', to: '/manager/applications' },
  { icon: 'smart_toy', label: 'AI', to: '/hr/ai-copilot' },
  { icon: 'analytics', label: 'Báo cáo', to: '/manager/reports' },
]

const headDepartmentItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'Tổng quan', to: '/hr/dashboard' },
  { icon: 'schedule', label: 'Phỏng vấn', to: '/hr/interviews' },
  { icon: 'person', label: 'Hồ sơ', to: '/internal/profile' },
]

const adminItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'Tổng quan', to: '/system-admin/dashboard' },
  { icon: 'group', label: 'Users', to: '/system-admin/users' },
  { icon: 'shield_person', label: 'Vai trò', to: '/system-admin/roles' },
  { icon: 'history', label: 'Logs', to: '/system-admin/audit-logs' },
]

function BottomNavBar() {
  const { portalVariant, primaryRole } = usePermissions()

  const items =
    portalVariant === 'candidate'
      ? defaultItems
      : primaryRole === ROLE_NAMES.SYSTEM_ADMIN
        ? adminItems
        : primaryRole === ROLE_NAMES.HEAD_DEPARTMENT
          ? headDepartmentItems
          : primaryRole === ROLE_NAMES.MANAGER
            ? managerItems
            : hrItems

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e3dddb] bg-white/95 shadow-[0_-14px_36px_-18px_rgba(26,28,28,0.42)] backdrop-blur-xl lg:hidden"
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
              `group relative flex min-h-[58px] flex-col items-center justify-center gap-1 px-1 pb-2 pt-2.5 text-[10px] font-bold transition-colors min-[390px]:text-[10.5px] ${
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
                <span className="max-w-full truncate leading-none">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNavBar
