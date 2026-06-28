import { createContext } from "react";

import type { NotificationItemDto } from "../../../services/notification/notificationService";

export type NotificationContextValue = {
  notifications: NotificationItemDto[];
  /** Count of notifications the user has not yet seen (bell not opened since arrival). Drives the bell badge. */
  unseenCount: number;
  /** Count of notifications the user has not yet clicked/read. Drives item styling. */
  unreadCount: number;
  loading: boolean;
  refreshing: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllSeen: () => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
};

export const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unseenCount: 0,
  unreadCount: 0,
  loading: false,
  refreshing: false,
  markAsRead: async () => {},
  markAllSeen: async () => {},
  markAllAsRead: async () => {},
  refresh: async () => {},
});
