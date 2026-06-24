import { createContext } from "react";

import type { NotificationItemDto } from "../../../services/notification/notificationService";

export type NotificationContextValue = {
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
