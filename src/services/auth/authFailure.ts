import { store } from "../../store";
import { logout } from "../../store/slices/authSlice";
import { clearProfile } from "../../store/slices/userSlice";
import { activePortal, loginPathForPortal } from "./authSession";

let isRedirectingToLogin = false;

export function forceLogoutAndRedirectToLogin() {
  const redirectPath = loginPathForPortal(activePortal());

  if (isRedirectingToLogin || window.location.pathname === redirectPath) {
    return;
  }

  isRedirectingToLogin = true;

  // logout() clears only the active portal's session, leaving the other portal signed in.
  store.dispatch(logout());
  store.dispatch(clearProfile());

  window.location.replace(redirectPath);
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
