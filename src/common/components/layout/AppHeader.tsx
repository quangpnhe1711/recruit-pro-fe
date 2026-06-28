import { useContext, useEffect, useId, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import { usePermissions } from "../../../hooks/usePermissions";
import { PERMISSIONS } from "../../../permissions/permissions";
import { ROLE_NAMES } from "../../../permissions/rolePermissions";
import HeaderAvatarDropDown from "../../../pages/internal/HeaderAvatarDropDown";
import type { RootState } from "../../../store";
import type { NotificationItemDto } from "../../../services/notification/notificationService";
import { NotificationContext } from "./NotificationContext";

export type AppHeaderMenuItem = {
  label: string;
  to: string;
};

type AppHeaderProps = {
  showNotifications?: boolean;
  menuItems?: AppHeaderMenuItem[];
  onMenuToggle?: () => void;
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
  { label: "Hồ sơ", to: "/candidate/profile" },
];

function formatRoleLabel(
  role: string | null | undefined,
  portalVariant: "candidate" | "internal",
) {
  if (portalVariant === "candidate") {
    return "Ứng viên";
  }

  switch (role) {
    case ROLE_NAMES.HR:
      return "HR";
    case ROLE_NAMES.HEAD_DEPARTMENT:
      return "Trưởng bộ phận";
    case ROLE_NAMES.MANAGER:
      return "Quản lý";
    case ROLE_NAMES.SYSTEM_ADMIN:
      return "Quản trị hệ thống";
    default:
      return "Người dùng nội bộ";
  }
}

/** Extract a navigable URL from notification.data without crashing on bad data. */
function resolveDeepLinkUrl(notification: NotificationItemDto): string | null {
  try {
    const raw = notification.data;
    if (!raw) return null;

    let parsed: Record<string, unknown>;
    if (typeof raw === "string") {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } else {
      parsed = raw as Record<string, unknown>;
    }

    const url = parsed["url"];
    if (typeof url === "string" && url.startsWith("/")) {
      return url;
    }
  } catch {
    // Malformed data — do not crash the bell.
  }
  return null;
}

function AppHeader({ showNotifications = true, menuItems, onMenuToggle }: AppHeaderProps) {
  const navigate = useNavigate();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const {
    notifications,
    unseenCount,
    unreadCount,
    loading,
    refreshing,
    markAsRead,
    markAllSeen,
    markAllAsRead,
    refresh,
  } = useContext(NotificationContext);
  const { defaultPath, hasPermission, portalVariant, primaryRole } =
    usePermissions();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonId = useId();

  const userName = authUser?.fullName ?? "Chưa có người dùng";
  const userRole = formatRoleLabel(primaryRole, portalVariant);
  const avatarSrc = authUser?.avatarUrl ?? undefined;
  const resolvedInitials = getInitials(userName);
  const canViewOwnProfile = hasPermission(
    PERMISSIONS.CANDIDATE_VIEW_OWN_PROFILE,
  );
  const canViewInternalProfile = hasPermission(
    PERMISSIONS.PROFILE_VIEW_INTERNAL,
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const resolvedMenuItems =
    menuItems ??
    (portalVariant === "candidate"
      ? defaultMenuItems
      : [
          ...(canViewInternalProfile
            ? [{ label: "Hồ sơ", to: "/internal/profile" }]
            : canViewOwnProfile
              ? [{ label: "Hồ sơ", to: "/candidate/profile" }]
              : []),
          ...(primaryRole === ROLE_NAMES.SYSTEM_ADMIN
            ? [{ label: "Bảng điều khiển Admin", to: "/system-admin/dashboard" }]
            : []),
          { label: "Tổng quan", to: defaultPath },
        ]);

  function handleBellClick() {
    const wasOpen = open;
    setOpen((value) => !value);
    if (!wasOpen) {
      // Opening the bell: refresh list then mark all as SEEN.
      // Do NOT mark as read — reading requires an intentional item click.
      void refresh().then(() => void markAllSeen());
    }
  }

  async function handleNotificationClick(notification: NotificationItemDto) {
    // Mark this specific notification as read.
    await markAsRead(notification.id);

    // Navigate to the stored deep-link URL.
    const url = resolveDeepLinkUrl(notification);
    if (url) {
      setOpen(false);
      navigate(url);
    } else {
      toast.info("Không tìm thấy đường dẫn thông báo.", { toastId: "noti-no-url" });
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#ececec] bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex flex-1 items-center gap-2">
          {onMenuToggle ? (
            <button
              type="button"
              className="premium-action -ml-2 flex h-10 w-10 items-center justify-center text-[#5f5e5e] transition-colors hover:bg-[#f3f0ef] hover:text-[#b90014] lg:hidden"
              aria-label="Mở menu điều hướng"
              onClick={onMenuToggle}
            >
              <span className="material-symbols-outlined text-[26px]">menu</span>
            </button>
          ) : null}

          {/* Compact brand for mobile (candidate portal has no sidebar on mobile) */}
          <div className="flex items-center gap-2 lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-gradient-to-br from-[#f0353d] to-[#b90014] text-white">
              <span className="material-symbols-outlined text-[18px]">hub</span>
            </span>
            <span className="text-[16px] font-bold tracking-[-0.01em] text-[#1a1c1c]">
              RecruitPro
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          {showNotifications ? (
            <div
              ref={panelRef}
              className="relative flex items-center gap-4 border-r border-[#e2dfde] pr-4 md:pr-6"
            >
              <button
                aria-controls={buttonId}
                aria-expanded={open}
                className="premium-action relative flex h-10 w-10 items-center justify-center rounded-lg text-[#5f5e5e] transition-colors hover:bg-[#f3f0ef] hover:text-[#b90014]"
                type="button"
                onClick={handleBellClick}
              >
                <span className="material-symbols-outlined">notifications</span>
                {unseenCount > 0 ? (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#b90014] px-1 text-[11px] font-bold text-white">
                    {unseenCount > 99 ? "99+" : unseenCount}
                  </span>
                ) : null}
              </button>

              {open ? (
                <div
                  id={buttonId}
                  className="animate-scale-in absolute right-0 top-[calc(100%+14px)] z-50 w-[calc(100vw-2rem)] max-w-[380px] origin-top-right overflow-hidden rounded-2xl border border-[#ececec] bg-white shadow-[0_24px_70px_rgba(26,28,28,0.18)]"
                >
                  <div className="flex items-center justify-between border-b border-[#f0eceb] px-4 py-4">
                    <div>
                      <p className="text-[15px] font-semibold text-[#1a1c1c]">
                        Thông báo
                      </p>
                      <p className="text-[12px] text-[#6f6b6a]">
                        {unreadCount > 0
                          ? `${unreadCount} thông báo chưa đọc`
                          : "Bạn đã xem hết thông báo"}
                      </p>
                    </div>
                    <button
                      className="premium-action rounded-md px-2 py-1 text-[12px] font-semibold text-[#b90014] hover:bg-[#fff1ef] disabled:text-[#c8b6b9]"
                      type="button"
                      disabled={!unreadCount}
                      onClick={() => void markAllAsRead()}
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {loading ? (
                      <div className="px-4 py-8 text-center text-[13px] text-[#6f6b6a]">
                        Đang tải thông báo...
                      </div>
                    ) : notifications.length ? (
                      notifications.map((notification) => (
                        <button
                          key={notification.id}
                          className={`block w-full border-b border-[#f7f2f1] px-4 py-4 text-left transition-colors duration-150 hover:bg-[#fcf7f7] ${
                            notification.isRead ? "bg-white" : "bg-[#fff7f8]"
                          }`}
                          type="button"
                          onClick={() => void handleNotificationClick(notification)}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                                notification.isRead
                                  ? "bg-[#d8d3d2]"
                                  : "bg-[#b90014]"
                              }`}
                            />
                            <div className="min-w-0 flex-1">
                              <p className={`text-[13px] font-semibold ${notification.isRead ? "text-[#5f5e5e]" : "text-[#1a1c1c]"}`}>
                                {notification.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[#5f5e5e]">
                                {notification.body}
                              </p>
                              <p className="mt-2 text-[11px] uppercase tracking-[0.04em] text-[#9a8e8c]">
                                {new Date(notification.createdAt).toLocaleString(
                                  "vi-VN",
                                  {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center text-[13px] text-[#6f6b6a]">
                        Chưa có thông báo nào.
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#f0eceb] px-4 py-3 text-right text-[11px] text-[#9a8e8c]">
                    {refreshing ? "Đang làm mới..." : "Realtime qua SignalR"}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center gap-3">
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
