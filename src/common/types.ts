export interface ApiResponse<T> {
  success: boolean;
  statusCode?: number;
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
