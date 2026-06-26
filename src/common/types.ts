export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
  // Stable machine-readable error code (ERROR-CONTRACT.md). Parse this BEFORE statusCode, and the
  // localized `message` last — never infer business state from the message text (INV-012).
  errorCode?: string | null;
  message: string;
  data: T | null;
  errors?: Record<string, string[]> | null;
  meta?: {
    page?: number;
    pageSize?: number;
    totalItems?: number;
    totalPages?: number;
  };
  extra?: unknown;
}
