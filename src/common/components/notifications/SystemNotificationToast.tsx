import type { NotificationItemDto } from "../../../services/notification/notificationService";

/**
 * Visual variant for a system notification card. Derived from the notification's
 * type/eventCode — never shown as raw text. Each variant has an accent color + icon.
 */
export type SystemToastVariant =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "workflow"
  | "application";

const VARIANT_STYLE: Record<
  SystemToastVariant,
  { icon: string; accent: string; chipBg: string; chipFg: string }
> = {
  success: { icon: "check_circle", accent: "#15803d", chipBg: "#eaf7ef", chipFg: "#15803d" },
  info: { icon: "notifications", accent: "#1d4ed8", chipBg: "#eaf0fe", chipFg: "#1d4ed8" },
  warning: { icon: "schedule", accent: "#b45309", chipBg: "#fdf2e3", chipFg: "#b45309" },
  error: { icon: "error", accent: "#c50f1b", chipBg: "#fdeceD", chipFg: "#c50f1b" },
  workflow: { icon: "account_tree", accent: "#7c3aed", chipBg: "#f2ecfe", chipFg: "#7c3aed" },
  application: { icon: "swap_horiz", accent: "#0f766e", chipBg: "#e7f6f4", chipFg: "#0f766e" },
};

/** Map a backend notification to a card variant using its type + eventCode (no raw JSON). */
export function resolveVariant(n: {
  type?: string | null;
  eventCode?: string | null;
}): SystemToastVariant {
  const code = `${n.type ?? ""} ${n.eventCode ?? ""}`.toLowerCase();
  if (code.includes("workflow") || code.includes("automation")) return "workflow";
  if (code.includes("reject") || code.includes("fail") || code.includes("error")) return "error";
  if (code.includes("overdue") || code.includes("reminder") || code.includes("warn")) return "warning";
  if (code.includes("offer") || code.includes("hired") || code.includes("success")) return "success";
  if (code.includes("application") || code.includes("review") || code.includes("status"))
    return "application";
  return "info";
}

type Props = {
  title: string;
  body?: string;
  timeLabel?: string;
  url?: string | null;
  variant: SystemToastVariant;
  onNavigate?: (url: string) => void;
  closeToast?: () => void;
};

/**
 * Polished bottom-right system notification card. Rendered inside a react-toastify toast
 * (container id "system"), so it is the transient layer only — the bell/list still persist
 * the notification. Card-style: rounded, left accent, icon, title, body, optional deep link.
 */
export function SystemNotificationToast({
  title,
  body,
  timeLabel,
  url,
  variant,
  onNavigate,
  closeToast,
}: Props) {
  const s = VARIANT_STYLE[variant] ?? VARIANT_STYLE.info;

  return (
    <div
      className="flex w-full gap-3 rounded-2xl border border-[#ececec] bg-white p-3.5 shadow-[0_18px_44px_-12px_rgba(26,28,28,0.28)]"
      style={{ borderLeft: `4px solid ${s.accent}` }}
      role="status"
    >
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ background: s.chipBg, color: s.chipFg }}
        aria-hidden="true"
      >
        <span className="material-symbols-outlined text-[20px]">{s.icon}</span>
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13.5px] font-semibold leading-snug text-[#1a1c1c]">{title}</p>
          <button
            type="button"
            aria-label="Đóng thông báo"
            className="premium-action -mr-1 -mt-0.5 shrink-0 text-[#a8a4a2] transition-colors hover:text-[#5f5e5e]"
            onClick={closeToast}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {body ? (
          <p className="mt-1 line-clamp-3 break-words text-[12.5px] leading-5 text-[#5f5e5e]">
            {body}
          </p>
        ) : null}

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] uppercase tracking-[0.04em] text-[#9a8e8c]">
            {timeLabel ?? "vừa xong"}
          </span>
          {url && onNavigate ? (
            <button
              type="button"
              className="premium-action inline-flex items-center gap-1 rounded-md px-2 py-1 text-[12px] font-semibold"
              style={{ color: s.accent }}
              onClick={() => {
                onNavigate(url);
                closeToast?.();
              }}
            >
              Xem chi tiết
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default SystemNotificationToast;
