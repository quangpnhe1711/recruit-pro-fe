import {
  useCallback,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";

import type { RootState } from "../../../store";
import {
  notificationService,
  type NotificationItemDto,
} from "../../../services/notification/notificationService";
import { openNotificationStream } from "../../../services/notification/notificationStream";
import { NotificationContext } from "./NotificationContext";

export function NotificationProvider({ children }: PropsWithChildren) {
  const isAuthenticated = useSelector(
    (state: RootState) => state.auth.isAuthenticated,
  );
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? null);
  const [notifications, setNotifications] = useState<NotificationItemDto[]>([]);
  const [unseenCount, setUnseenCount] = useState(0);
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
        const [notificationsResponse, countsResponse] = await Promise.all([
          notificationService.getNotifications(1, 8),
          notificationService.getCounts(),
        ]);

        const nextItems = notificationsResponse.data?.items ?? [];

        setNotifications(nextItems);
        setUnseenCount(countsResponse.data?.unseen ?? 0);
        setUnreadCount(countsResponse.data?.unread ?? 0);
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
        setUnseenCount(0);
        setUnreadCount(0);
      }, 0);
      return () => window.clearTimeout(resetTimer);
    }

    let cancelled = false;

    const runInitialLoad = async () => {
      setLoading(true);
      try {
        const [notificationsResponse, countsResponse] = await Promise.all([
          notificationService.getNotifications(1, 8),
          notificationService.getCounts(),
        ]);

        if (cancelled) return;

        const nextItems = notificationsResponse.data?.items ?? [];
        setNotifications(nextItems);
        setUnseenCount(countsResponse.data?.unseen ?? 0);
        setUnreadCount(countsResponse.data?.unread ?? 0);
      } catch {
        if (!cancelled) {
          setNotifications([]);
          setUnseenCount(0);
          setUnreadCount(0);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Realtime delivery over SSE (replaces SignalR). Best-effort: the REST load above is the
    // baseline; pushed events are layered on top, and a reconnect re-syncs from REST.
    const closeStream = openNotificationStream({
      onNotification: (notification: NotificationItemDto) => {
        if (cancelled) return;

        setNotifications((current) => {
          // Dedupe: a reconnect may re-deliver an event we already have.
          if (current.some((item) => item.id === notification.id)) {
            return current;
          }
          return [notification, ...current].slice(0, 8);
        });
        // A newly arrived notification is, by definition, unseen and unread. Do NOT mark it
        // seen/read here — seen happens when the bell opens, read when the item is clicked.
        setUnseenCount((current) => current + 1);
        setUnreadCount((current) => current + (notification.isRead ? 0 : 1));
        toast.info(notification.title || "Bạn có thông báo mới.");
      },
      onReconnect: () => {
        if (!cancelled) {
          void refreshNotifications(true);
        }
      },
    });

    void runInitialLoad();

    return () => {
      cancelled = true;
      closeStream();
    };
  }, [isAuthenticated, refreshNotifications, userId]);

  // Opening the bell: mark all as SEEN only. Do NOT mark as read.
  const markAllSeen = async () => {
    if (unseenCount === 0) return;

    await notificationService.markAllSeen();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isSeen: true })),
    );
    setUnseenCount(0);
    // unreadCount is unchanged — items still show unread styling until clicked.
  };

  // Clicking a specific notification item: mark as read (also marks seen).
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
          ? { ...notification, isRead: true, isSeen: true }
          : notification,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
    if (!target.isSeen) {
      setUnseenCount((current) => Math.max(0, current - 1));
    }
  };

  const markAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true, isSeen: true })),
    );
    setUnseenCount(0);
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unseenCount,
        unreadCount,
        loading,
        refreshing,
        markAsRead,
        markAllSeen,
        markAllAsRead,
        refresh: () => refreshNotifications(false),
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
