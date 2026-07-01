import { toast } from "react-toastify";

import type { NotificationItemDto } from "../../../services/notification/notificationService";
import {
  SystemNotificationToast,
  resolveVariant,
  type SystemToastVariant,
} from "./SystemNotificationToast";
import { createElement } from "react";

/** react-toastify container id for system/real-time notifications (bottom-right, custom card). */
export const SYSTEM_TOAST_CONTAINER = "system";

/** Extract an internal deep-link URL from notification.data without crashing on bad data. */
export function resolveNotificationUrl(notification: NotificationItemDto): string | null {
  try {
    const raw = notification.data;
    if (!raw) return null;
    const parsed = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown>;
    const url = parsed["url"];
    if (typeof url === "string" && url.startsWith("/")) return url;
  } catch {
    /* malformed data — ignore */
  }
  return null;
}

type ShowOptions = {
  /** SPA navigator (react-router `navigate`); falls back to full load if absent. */
  navigate?: (url: string) => void;
  /** Override the auto-detected variant. */
  variant?: SystemToastVariant;
};

/**
 * Show a polished system-notification card (bottom-right desktop / viewport-safe mobile).
 * This is the transient visual layer only — persistence + the bell list are handled elsewhere.
 * Replaces the old raw `toast.info(...)` for system/real-time notifications.
 */
export function showSystemNotificationToast(
  notification: NotificationItemDto,
  options: ShowOptions = {},
) {
  const url = resolveNotificationUrl(notification);
  const variant = options.variant ?? resolveVariant(notification);
  const navigate =
    options.navigate ??
    ((to: string) => {
      window.location.assign(to);
    });

  const toastId = `sys-${notification.id}`;
  toast(
    ({ closeToast }) =>
      createElement(SystemNotificationToast, {
        title: notification.title || "Bạn có thông báo mới.",
        body: notification.body,
        url,
        variant,
        timeLabel: "vừa xong",
        onNavigate: navigate,
        // Dismiss by id — reliable across the dedicated "system" container.
        closeToast: () => {
          closeToast?.();
          toast.dismiss(toastId);
        },
      }),
    {
      containerId: SYSTEM_TOAST_CONTAINER,
      toastId,
      autoClose: 6000,
    },
  );
}

/**
 * Generic system toast for client-side pushed messages that are not persisted notifications
 * (e.g. a workflow action confirmation). Keeps the same polished card look.
 */
export function showSystemToast(payload: {
  title: string;
  body?: string;
  url?: string | null;
  variant?: SystemToastVariant;
  navigate?: (url: string) => void;
}) {
  const navigate =
    payload.navigate ?? ((to: string) => window.location.assign(to));
  toast(
    ({ closeToast }) =>
      createElement(SystemNotificationToast, {
        title: payload.title,
        body: payload.body,
        url: payload.url,
        variant: payload.variant ?? "info",
        timeLabel: "vừa xong",
        onNavigate: navigate,
        closeToast,
      }),
    { containerId: SYSTEM_TOAST_CONTAINER, autoClose: 6000 },
  );
}
