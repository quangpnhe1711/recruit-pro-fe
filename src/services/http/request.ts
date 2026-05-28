import type { AxiosRequestConfig } from "axios";
import apiClient from "./api-client";

export const request = {
  get: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get(url, config) as Promise<T>;
  },

  post: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return apiClient.post(url, data, config) as Promise<T>;
  },

  put: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return apiClient.put(url, data, config) as Promise<T>;
  },

  patch: async <T, D = unknown>(
    url: string,
    data?: D,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    return apiClient.patch(url, data, config) as Promise<T>;
  },

  delete: async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete(url, config) as Promise<T>;
  },
};
