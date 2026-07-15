import axios from "axios";
import {
  forceLogoutAndRedirectToLogin,
  isBrokenJwtClaimError,
} from "../auth/authFailure";
import { hasUsableRefreshToken } from "../auth/authToken";
import { activePortal, patchSession, readSession } from "../auth/authSession";
import { store } from "../../store";
import { setAccessToken } from "../../store/slices/authSlice";

const authFreeEndpoints = [
  "/auth/login",
  "/auth/candidate/login",
  "/auth/internal/login",
  "/auth/candidate/forgot-password",
  "/auth/internal/forgot-password",
  "/auth/register",
  // The refresh call itself must never re-enter the refresh-then-retry gate below.
  "/auth/refresh",
];

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

apiClient.interceptors.request.use((config) => {
  // Attach the token of the portal the current page belongs to (candidate vs internal run as
  // independent, concurrent sessions).
  const token = readSession(activePortal())?.accessToken;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Silent-refresh singleton: N requests can 401 at the same instant, but refresh tokens are
// single-use (the server rotates them), so every concurrent 401 must await the SAME refresh
// and then retry with the one new access token. The `.finally` clears the slot once it settles.
let refreshPromise: Promise<string> | null = null;

async function runRefresh(): Promise<string> {
  const portal = activePortal();
  const refreshToken = readSession(portal)?.refreshToken;
  if (!hasUsableRefreshToken(refreshToken)) {
    throw new Error("No refresh token available");
  }

  // Bare axios (not apiClient) so the unwrap + refresh interceptors don't touch this call.
  const response = await axios.post(
    `${apiClient.defaults.baseURL}/auth/refresh`,
    { refreshToken },
  );

  const data = response.data?.data;
  const newAccessToken: string | undefined = data?.accessToken;
  const newRefreshToken: string | undefined = data?.refreshToken;

  if (!newAccessToken) {
    throw new Error("Refresh response missing access token");
  }

  store.dispatch(setAccessToken(newAccessToken));
  if (newRefreshToken) {
    patchSession(portal, { refreshToken: newRefreshToken });
  }

  return newAccessToken;
}

apiClient.interceptors.response.use(
  // unwrap AxiosResponse -> ApiResponse<T>
  (response) => response.data,

  async (error) => {
    const originalRequest = error.config;
    const shouldSkipRefresh = authFreeEndpoints.some((endpoint) =>
      originalRequest?.url?.includes(endpoint),
    );

    // A stale/expired access token surfaces either as HTTP 401 or as a broken-JWT-claim message;
    // both are refreshable. Fold them into ONE gate so an expired token is refreshed, not logged out.
    const canRefresh =
      (error.response?.status === 401 || isBrokenJwtClaimError(error)) &&
      !shouldSkipRefresh &&
      !originalRequest?._retry;

    if (canRefresh) {
      originalRequest._retry = true;

      if (!refreshPromise) {
        refreshPromise = runRefresh().finally(() => {
          refreshPromise = null;
        });
      }

      try {
        const newAccessToken = await refreshPromise;
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return apiClient(originalRequest);
      } catch {
        // Refresh failed (expired/unknown token, or the account was deactivated: token_version
        // bumped + refresh tokens revoked server-side) -> hard logout.
        forceLogoutAndRedirectToLogin();
        return Promise.reject(error);
      }
    }

    // Not refreshable (retry already spent, or an auth-free endpoint): keep the old hard-logout.
    if (
      (isBrokenJwtClaimError(error) || error.response?.status === 401) &&
      !shouldSkipRefresh
    ) {
      forceLogoutAndRedirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default apiClient;
