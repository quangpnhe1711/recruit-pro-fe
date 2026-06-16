import { useLocation } from "react-router-dom";
import { store } from "../../store";
import { logout, type Variant } from "../../store/slices/authSlice";
import { clearProfile } from "../../store/slices/userSlice";
import { endpoints } from "../http/endpoints";

let isRedirectingToLogin = false;

function resolveLoginPath(variant: Variant | null | undefined) {
  return variant === "internal" ? "/internal/login" : "/login";
}

export function forceLogoutAndRedirectToLogin() {
  var location = useLocation();
  const authRoutes = Object.values(endpoints.auth) as string[];
  const publicRoutes = Object.values(endpoints.public) as string[];

  if (
    isRedirectingToLogin ||
    authRoutes.includes(location.pathname) ||
    publicRoutes.includes(location.pathname)
  ) {
    return;
  }

  isRedirectingToLogin = true;

  const currentVariant = localStorage.getItem(
    "current_variant",
  ) as Variant | null;
  const loginPath = resolveLoginPath(currentVariant);

  store.dispatch(logout());
  store.dispatch(clearProfile());

  window.location.replace(loginPath);
}

export function isBrokenJwtClaimError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorRecord = error as {
    message?: unknown;
    response?: {
      data?: {
        message?: unknown;
        error?: unknown;
        errors?: unknown;
      };
    };
  };

  const candidates = [
    errorRecord.message,
    errorRecord.response?.data?.message,
    errorRecord.response?.data?.error,
    errorRecord.response?.data?.errors,
  ]
    .flatMap((value) => {
      if (Array.isArray(value)) {
        return value;
      }

      return [value];
    })
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());

  return candidates.some(
    (value) =>
      value.includes("missing user id claim") ||
      value.includes("invalid token") ||
      value.includes("invalid jwt") ||
      value.includes("jwt malformed") ||
      value.includes("token is expired") ||
      (value.includes("signature") && value.includes("invalid")),
  );
}
