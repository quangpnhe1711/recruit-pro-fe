import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export type NotificationItemDto = {
  id: string;
  userId: string;
  eventCode: string;
  title: string;
  body: string;
  type: string;
  data?: unknown;
  entityType?: string | null;
  entityId?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type NotificationListResponseDto = {
  items: NotificationItemDto[];
  meta?: ApiResponse<unknown>["meta"];
};

export type NotificationUnreadCountDto = {
  unreadCount: number;
};

export const notificationService = {
  getNotifications: async (
    page = 1,
    pageSize = 10,
  ): Promise<ApiResponse<NotificationListResponseDto>> => {
    return request.get<ApiResponse<NotificationListResponseDto>>(
      endpoints.notifications.list,
      {
        params: { page, pageSize },
      },
    );
  },

  getUnreadCount: async (): Promise<ApiResponse<NotificationUnreadCountDto>> => {
    return request.get<ApiResponse<NotificationUnreadCountDto>>(
      endpoints.notifications.unreadCount,
    );
  },

  markAsRead: async (
    notificationId: string,
  ): Promise<ApiResponse<NotificationItemDto>> => {
    return request.patch<ApiResponse<NotificationItemDto>>(
      endpoints.notifications.markRead(notificationId),
    );
  },

  markAllAsRead: async (): Promise<ApiResponse<NotificationUnreadCountDto>> => {
    return request.patch<ApiResponse<NotificationUnreadCountDto>>(
      endpoints.notifications.markAllRead,
    );
  },
};
