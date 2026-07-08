import { toast, type ToastOptions } from "react-toastify";

import { ERROR_CODES, getErrorMessage, normalizeApiError } from "./apiError";

/**
 * The single toast entry point. Success/info take an already-localized string (reuse the i18n `t()`
 * success keys the app already has); error/warning take a stable error CODE and resolve copy from the
 * i18n `errors.*` namespace — never the backend message. `toastId` dedupes rapid duplicate toasts
 * (double-click spam) on top of the container's `limit={3}`.
 *
 * Toast rule (ERROR-CONTRACT.md): toast ONLY success / server / network / timeout / unexpected errors,
 * or actions with no form context. Validation & field-level business errors render inline on the form
 * (see handleApiFormError) and must NOT be toasted.
 */
export const appToast = {
  success(message: string, opts?: ToastOptions) {
    toast.success(message, { toastId: message, ...opts });
  },
  info(message: string, opts?: ToastOptions) {
    toast.info(message, { toastId: message, ...opts });
  },
  error(code: string, params?: Record<string, unknown>, opts?: ToastOptions) {
    toast.error(getErrorMessage(code, params), { toastId: code, ...opts });
  },
  warning(code: string, params?: Record<string, unknown>, opts?: ToastOptions) {
    toast.warn(getErrorMessage(code, params), { toastId: code, ...opts });
  },
  serverError() {
    appToast.error(ERROR_CODES.ServerError);
  },
  networkError() {
    appToast.error(ERROR_CODES.NetworkError);
  },
  timeoutError() {
    appToast.error(ERROR_CODES.TimeoutError);
  },
};

/**
 * Toast the right message for a NON-form error: server/network/timeout/unexpected, or a 4xx action
 * that has no form context (quick delete/approve/archive). Use when `handleApiFormError` returns false.
 */
export function handleNonFormApiError(error: unknown): void {
  const normalized = normalizeApiError(error);
  if (normalized.type === "NETWORK_ERROR") {
    appToast.networkError();
    return;
  }
  if (normalized.type === "TIMEOUT_ERROR") {
    appToast.timeoutError();
    return;
  }
  if (normalized.isServerLike) {
    appToast.serverError();
    return;
  }
  appToast.error(normalized.code, normalized.globalErrors[0]?.params ?? normalized.fieldErrors[0]?.params);
}
