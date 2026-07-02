import { NavLink } from 'react-router-dom'

import { usePermissions } from '../../../hooks/usePermissions'
import { ROLE_NAMES } from '../../../permissions/rolePermissions'
import { useI18n } from '../../../i18n'

type BottomNavItem = {
  icon: string
  /** i18n key for the item label. */
  label: string
  to: string
  /** Exact-match active highlight (NavLink `end`). */
  end?: boolean
}

const defaultItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'nav.dashboard', to: '/candidate/dashboard' },
  { icon: 'work', label: 'nav.findJobs', to: '/jobs' },
  { icon: 'inbox', label: 'nav.myApplications', to: '/candidate/my-applications' },
  { icon: 'event', label: 'nav.interviews', to: '/candidate/interviews' },
  { icon: 'person', label: 'nav.profile', to: '/candidate/profile' },
]

const hrItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'nav.dashboard', to: '/hr/dashboard' },
  { icon: 'work', label: 'nav.jobs', to: '/jobs' },
  { icon: 'group', label: 'nav.candidates', to: '/hr/candidates' },
  { icon: 'smart_toy', label: 'nav.aiCopilot', to: '/hr/ai-copilot' },
  { icon: 'schedule', label: 'nav.interviews', to: '/hr/interviews' },
]

const managerItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'nav.dashboard', to: '/manager/dashboard' },
  { icon: 'approval', label: 'nav.jobApproval', to: '/jobs' },
  { icon: 'description', label: 'nav.applications', to: '/manager/applications' },
  { icon: 'smart_toy', label: 'nav.aiCopilot', to: '/hr/ai-copilot' },
  { icon: 'analytics', label: 'nav.reports', to: '/manager/reports' },
]

const headDepartmentItems: BottomNavItem[] = [
  { icon: 'dashboard', label: 'nav.dashboard', to: '/hr/dashboard' },
  { icon: 'schedule', label: 'nav.interviews', to: '/hr/interviews' },
  { icon: 'person', label: 'nav.profile', to: '/internal/profile' },
]

// Mobile sysadmin nav surfaces the real product (automation), not the
// backend-pending placeholder screens.
const adminItems: BottomNavItem[] = [
  { icon: 'space_dashboard', label: 'nav.dashboard', to: '/system-admin/automation', end: true },
  { icon: 'account_tree', label: 'nav.workflows', to: '/system-admin/automation/workflows' },
  { icon: 'play_circle', label: 'nav.executions', to: '/system-admin/automation/executions' },
  { icon: 'troubleshoot', label: 'nav.diagnostics', to: '/system-admin/automation/diagnostics' },
]

function BottomNavBar() {
  const { portalVariant, primaryRole } = usePermissions()
  const { t } = useI18n()

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
            end={item.end}
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
                <span className="max-w-full truncate leading-none">{t(item.label)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default BottomNavBar
