import {
  createContext,
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

type NotificationContextValue = {
  notifications: NotificationItemDto[];
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  loading: false,
  refreshing: false,
  markAsRead: async () => {},
  markAllAsRead: async () => {},
  refresh: async () => {},
});

function resolveNotificationHubUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";
  const resolvedUrl = new URL(configuredBaseUrl, window.location.origin);
  resolvedUrl.pathname = "/hubs/notifications";
  resolvedUrl.search = "";
  resolvedUrl.hash = "";
  return resolvedUrl.toString();
}

export function NotificationProvider({ children }: PropsWithChildren) {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let cancelled = false;
    const connection = new HubConnectionBuilder()
      .withUrl(resolveNotificationHubUrl(), {
        accessTokenFactory: () => localStorage.getItem("access_token") ?? "",
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

    void runInitialLoad();
    void connection.start().catch(() => undefined);

    return () => {
      cancelled = true;
      if (connection.state !== HubConnectionState.Disconnected) {
        void connection.stop();
      }
    };
  }, [isAuthenticated, userId]);

  const refreshNotifications = async (silent = false) => {
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
  };

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
