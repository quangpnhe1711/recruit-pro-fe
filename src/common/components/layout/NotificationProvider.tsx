import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import {
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import type { RootState } from "../../../store";
import {
  notificationService,
  type NotificationItemDto,
} from "../../../services/notification/notificationService";
import { NotificationContext } from "./NotificationContext";

function resolveNotificationHubUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  const resolvedUrl = new URL(configuredBaseUrl, window.location.origin);
  // Keep the same host (and any sub-path) as the REST API, only swapping the
  // trailing "/api" segment for the hub path. This guarantees the hub is reached
  // through the exact same channel/proxy as the API, so it can't drift into an
  // un-proxied path (which would 405 on the negotiate POST).
  resolvedUrl.pathname =
    resolvedUrl.pathname.replace(/\/api\/?$/, "") + "/hubs/notifications";
  resolvedUrl.search = "";
  resolvedUrl.hash = "";
  return resolvedUrl.toString();
}

// Bounded backoff for the *initial* connection. withAutomaticReconnect only covers
// drops after a connection is established; it does not retry a failed start. Without
// this, a transient hub failure left realtime notifications permanently dead.
const INITIAL_CONNECT_DELAYS_MS = [0, 2000, 5000, 10000, 20000];

export function NotificationProvider({ children }: PropsWithChildren) {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const refreshNotifications = useCallback(
    async (silent = false) => {
      if (!isAuthenticated || !userId) return;

      if (!silent) {
        setRefreshing(true);
      }

      try {
        const [notificationsResponse, unreadResponse] = await Promise.all([
          notificationService.getNotifications(1, 8),
          notificationService.getUnreadCount(),
        ]);

        const nextItems = notificationsResponse.data?.items ?? [];

        setNotifications(nextItems);
        setUnreadCount(unreadResponse.data?.unreadCount ?? 0);
      } finally {
        if (!silent) {
          setRefreshing(false);
        }
      }
    },
    [isAuthenticated, userId],
  );

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      const resetTimer = window.setTimeout(() => {
        setNotifications([]);
        setUnreadCount(0);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    let cancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl(resolveNotificationHubUrl(), {
        accessTokenFactory: () => localStorage.getItem("access_token") ?? "",
        withCredentials: false,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Error)
      .build();

    const runInitialLoad = async () => {
      setLoading(true);
      try {
        const [notificationsResponse, unreadResponse] = await Promise.all([
          notificationService.getNotifications(1, 8),
          notificationService.getUnreadCount(),
        ]);

        if (cancelled) return;

        const nextItems = notificationsResponse.data?.items ?? [];
        setNotifications(nextItems);
        setUnreadCount(unreadResponse.data?.unreadCount ?? 0);
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    connection.on("notification:new", (notification: NotificationItemDto) => {
      if (cancelled) {
        return;
      }

      setNotifications((current) => {
        if (current.some((item) => item.id === notification.id)) {
          return current;
        }

        return [notification, ...current].slice(0, 8);
      });
      setUnreadCount((current) => current + (notification.isRead ? 0 : 1));
      toast.info(notification.title || "Bạn có thông báo mới.");
    });

    connection.onreconnected(() => refreshNotifications(true));

    const startWithRetry = async () => {
      for (
        let attempt = 0;
        !cancelled && connection.state === HubConnectionState.Disconnected;
        attempt += 1
      ) {
        try {
          await connection.start();
          // Re-sync after (re)connecting so nothing pushed while we were offline is missed.
          if (!cancelled) {
            void refreshNotifications(true);
          }
          return;
        } catch {
          if (attempt >= INITIAL_CONNECT_DELAYS_MS.length - 1) {
            // Give up quietly: realtime is best-effort and the REST load already
            // populated the panel. Avoids flooding the console with repeated errors.
            return;
          }
          const delay = INITIAL_CONNECT_DELAYS_MS[attempt + 1];
          await new Promise((resolve) => window.setTimeout(resolve, delay));
        }
      }
    };

    void runInitialLoad();
    void startWithRetry();

    return () => {
      cancelled = true;
      if (connection.state !== HubConnectionState.Disconnected) {
        void connection.stop();
      }
    };
  }, [isAuthenticated, refreshNotifications, userId]);

  const markAsRead = async (notificationId: string) => {
    const target = notifications.find(
      (notification) => notification.id === notificationId,
    );

    if (!target || target.isRead) {
      return;
    }

    await notificationService.markAsRead(notificationId);
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        refreshing,
        markAsRead,
        markAllAsRead,
        refresh: () => refreshNotifications(false),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
