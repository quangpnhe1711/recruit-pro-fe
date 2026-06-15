import axios from "axios";
import { logout } from "../../store/slices/authSlice";

const authFreeEndpoints = [
  "/auth/login",
  "/auth/candidate/login",
  "/auth/internal/login",
  "/auth/candidate/forgot-password",
  "/auth/internal/forgot-password",
  "/auth/register",
  "/auth/refresh-token",
];

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

const refreshClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    logout();
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

    const isUnauthorized = error.response?.status === 401;

    const isRefreshRequest = originalRequest.url?.includes(
      "/auth/refresh-token",
    );

    if (
      isUnauthorized &&
      !originalRequest._retry &&
      !isRefreshRequest &&
      !shouldSkipRefresh
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh_token");

        const response = await refreshClient.post("/auth/refresh-token", {
          refreshToken,
        });

        const newAccessToken = response.data.data.accessToken;

        localStorage.setItem("access_token", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auth_user");
        localStorage.removeItem("current_variant");

        window.location.href = "/login";

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
