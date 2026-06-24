import axios from "axios";
import {
  forceLogoutAndRedirectToLogin,
  isBrokenJwtClaimError,
} from "../auth/authFailure";

const authFreeEndpoints = [
  "/auth/login",
  "/auth/candidate/login",
  "/auth/internal/login",
  "/auth/candidate/forgot-password",
  "/auth/internal/forgot-password",
  "/auth/register",
];

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  // unwrap AxiosResponse -> ApiResponse<T>
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config;
    const shouldSkipRefresh = authFreeEndpoints.some((endpoint) =>
      originalRequest.url?.includes(endpoint),
    );

    if (isBrokenJwtClaimError(error) && !shouldSkipRefresh) {
      forceLogoutAndRedirectToLogin();
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;

    if (isUnauthorized && !shouldSkipRefresh) {
      forceLogoutAndRedirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
