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
  isSeen: boolean;
  createdAt: string;
};

export type NotificationListResponseDto = {
  items: NotificationItemDto[];
  meta?: ApiResponse<unknown>["meta"];
};

export type NotificationCountsDto = {
  unseen: number;
  unread: number;
};

function isMethodNotAllowedError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { status?: number } }).response?.status === "number" &&
    (error as { response?: { status?: number } }).response?.status === 405
  );
}

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

  getCounts: async (): Promise<ApiResponse<NotificationCountsDto>> => {
    return request.get<ApiResponse<NotificationCountsDto>>(
      endpoints.notifications.counts,
    );
  },

  markAllSeen: async (): Promise<ApiResponse<NotificationCountsDto>> => {
    return request.post<ApiResponse<NotificationCountsDto>>(
      endpoints.notifications.markAllSeen,
    );
  },

  markAsRead: async (
    notificationId: string,
  ): Promise<ApiResponse<NotificationItemDto>> => {
    try {
      return await request.patch<ApiResponse<NotificationItemDto>>(
        endpoints.notifications.markRead(notificationId),
      );
    } catch (error) {
      if (!isMethodNotAllowedError(error)) {
        throw error;
      }

      return request.post<ApiResponse<NotificationItemDto>>(
        endpoints.notifications.markRead(notificationId),
      );
    }
  },

  markAllAsRead: async (): Promise<ApiResponse<NotificationCountsDto>> => {
    try {
      return await request.patch<ApiResponse<NotificationCountsDto>>(
        endpoints.notifications.markAllRead,
      );
    } catch (error) {
      if (!isMethodNotAllowedError(error)) {
        throw error;
      }

      return request.post<ApiResponse<NotificationCountsDto>>(
        endpoints.notifications.markAllRead,
      );
    }
  },
};
