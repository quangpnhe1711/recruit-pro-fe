import axios from "axios";

import { translate, type TranslateVars } from "../../i18n";

// Stable, machine-readable error codes shared with the backend (ERROR-CONTRACT.md). Keep in sync with
// RecruitPro.Application.Common.ErrorCodes on the server. The frontend must branch on the error code
// first, the HTTP status second, and the localized message last — never infer business state from the
// message text (INV-012).
export const ERROR_CODES = {
  ApplicationAlreadyActive: "APPLICATION_ALREADY_ACTIVE",
  ApplicationAlreadyHired: "APPLICATION_ALREADY_HIRED",
  JobNotAcceptingApplications: "JOB_NOT_ACCEPTING_APPLICATIONS",
  JobDeadlinePassed: "JOB_DEADLINE_PASSED",
  CandidateProfileIncomplete: "CANDIDATE_PROFILE_INCOMPLETE",
  ResumeRequired: "RESUME_REQUIRED",
  ApplicationNotFound: "APPLICATION_NOT_FOUND",
  ApplicationNotWithdrawable: "APPLICATION_NOT_WITHDRAWABLE",
  InvalidApplicationTransition: "INVALID_APPLICATION_TRANSITION",
  InterviewNotActionable: "INTERVIEW_NOT_ACTIONABLE",
  OfferNotActionable: "OFFER_NOT_ACTIONABLE",
  // Post-interview decision gates + email-gated Offer/Reject transitions (workflow-correctness phase).
  InterviewRequired: "INTERVIEW_REQUIRED",
  InterviewNotCompleted: "INTERVIEW_NOT_COMPLETED",
  EmailRequiredForOffer: "EMAIL_REQUIRED_FOR_OFFER",
  EmailRequiredForRejection: "EMAIL_REQUIRED_FOR_REJECTION",
  EmailSendFailed: "EMAIL_SEND_FAILED",
  Unauthenticated: "UNAUTHENTICATED",
  Forbidden: "FORBIDDEN",
  ValidationError: "VALIDATION_ERROR",
  // Ownership / job-approval domain (Phase 2/3 backend, mirrored here for Phase 4 FE).
  // Source: RecruitPro.Application.Common.ErrorCodes + docs/source-of-truth/ERROR-CONTRACT.md.
  DepartmentHeadRequired: "DEPARTMENT_HEAD_REQUIRED",
  InvalidDepartmentHead: "INVALID_DEPARTMENT_HEAD",
  JobRecruiterRequired: "JOB_RECRUITER_REQUIRED",
  InvalidJobRecruiter: "INVALID_JOB_RECRUITER",
  InvalidJobTransition: "INVALID_JOB_TRANSITION",
  DepartmentNotFound: "DEPARTMENT_NOT_FOUND",

  // Code-first error contract (mirrors RecruitPro.Application.Common.ErrorCodes). The FE branches on
  // these and renders copy from the i18n `errors.*` namespace — never the backend message.
  ValidationFailed: "VALIDATION_FAILED",
  FormInvalid: "FORM_INVALID",
  InvalidInput: "INVALID_INPUT",
  Required: "REQUIRED",
  InvalidEmailFormat: "INVALID_EMAIL",
  InvalidFormat: "INVALID_FORMAT",
  MaxLengthExceeded: "MAX_LENGTH_EXCEEDED",
  MinLengthRequired: "MIN_LENGTH_REQUIRED",
  OutOfRange: "OUT_OF_RANGE",
  InvalidAmount: "INVALID_AMOUNT",
  EmailAlreadyExists: "EMAIL_ALREADY_EXISTS",
  UsernameAlreadyExists: "USERNAME_ALREADY_EXISTS",
  PasswordTooWeak: "PASSWORD_TOO_WEAK",
  PasswordTooShort: "PASSWORD_TOO_SHORT",
  InvalidCredentials: "INVALID_CREDENTIALS",
  TokenExpired: "TOKEN_EXPIRED",
  PortalAccessDenied: "PORTAL_ACCESS_DENIED",
  AccountDisabled: "ACCOUNT_DISABLED",
  EntityNotFound: "ENTITY_NOT_FOUND",
  JobNotFound: "JOB_NOT_FOUND",
  CandidateNotFound: "CANDIDATE_NOT_FOUND",
  CandidateProfileNotFound: "CANDIDATE_PROFILE_NOT_FOUND",
  UserNotFound: "USER_NOT_FOUND",
  InterviewNotFound: "INTERVIEW_NOT_FOUND",
  ResumeNotFound: "RESUME_NOT_FOUND",
  RoleNotFound: "ROLE_NOT_FOUND",
  CandidateRoleNotFound: "CANDIDATE_ROLE_NOT_FOUND",
  ExperienceNotFound: "EXPERIENCE_NOT_FOUND",
  NotificationNotFound: "NOTIFICATION_NOT_FOUND",
  WorkflowNotFound: "WORKFLOW_NOT_FOUND",
  WorkflowExecutionNotFound: "WORKFLOW_EXECUTION_NOT_FOUND",
  McpToolNotFound: "MCP_TOOL_NOT_FOUND",
  OfferNotFound: "OFFER_NOT_FOUND",
  RbacRoleNotFound: "RBAC_ROLE_NOT_FOUND",
  Conflict: "CONFLICT",
  DuplicateEntity: "DUPLICATE_ENTITY",
  BusinessRuleViolation: "BUSINESS_RULE_VIOLATION",
  InvalidStatusTransition: "INVALID_STATUS_TRANSITION",
  JobClosed: "JOB_CLOSED",
  SalaryRangeInvalid: "SALARY_RANGE_INVALID",
  DateMustBeInFuture: "DATE_MUST_BE_IN_FUTURE",
  InterviewTimeInvalid: "INTERVIEW_TIME_INVALID",
  InterviewTimeInPast: "INTERVIEW_TIME_IN_PAST",
  OfferAlreadySent: "OFFER_ALREADY_SENT",
  JobDeadlineInvalid: "JOB_DEADLINE_INVALID",
  RbacUnknownPermission: "RBAC_UNKNOWN_PERMISSION",
  RbacAdminLockout: "RBAC_ADMIN_LOCKOUT",
  UserStatusInvalid: "USER_STATUS_INVALID",
  UserSelfDeactivation: "USER_SELF_DEACTIVATION",
  FileRequired: "FILE_REQUIRED",
  FileTooLarge: "FILE_TOO_LARGE",
  UnsupportedFileType: "UNSUPPORTED_FILE_TYPE",
  FileUploadFailed: "FILE_UPLOAD_FAILED",
  ResumeFileRequired: "RESUME_FILE_REQUIRED",
  ResumeFileEmpty: "RESUME_FILE_EMPTY",
  ResumeFileTooLarge: "RESUME_FILE_TOO_LARGE",
  ResumeFileUnsupportedType: "RESUME_FILE_UNSUPPORTED_TYPE",
  AiProviderUnavailable: "AI_PROVIDER_UNAVAILABLE",
  AiProcessingFailed: "AI_PROCESSING_FAILED",
  ServerError: "SERVER_ERROR",
  UnexpectedError: "UNEXPECTED_ERROR",
  NetworkError: "NETWORK_ERROR",
  TimeoutError: "TIMEOUT_ERROR",
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

type ErrorEnvelope = {
  errorCode?: string | null;
  statusCode?: number;
  message?: string;
};

function readEnvelope(error: unknown): ErrorEnvelope | undefined {
  if (!error || typeof error !== "object") return undefined;
  // Axios error: payload is on error.response.data; the api-client also rejects with the raw error.
  const maybeAxios = error as { response?: { data?: unknown; status?: number }; data?: unknown };
  const data = (maybeAxios.response?.data ?? maybeAxios.data) as ErrorEnvelope | undefined;
  if (data && typeof data === "object") {
    return {
      errorCode: data.errorCode ?? null,
      statusCode: data.statusCode ?? maybeAxios.response?.status,
      message: data.message,
    };
  }
  if (maybeAxios.response?.status) {
    return { statusCode: maybeAxios.response.status };
  }
  return undefined;
}

/** Returns the stable backend error code for an error, or null if none was provided. */
export function getApiErrorCode(error: unknown): string | null {
  return readEnvelope(error)?.errorCode ?? null;
}

/** Returns the HTTP status code from an error envelope/axios error, or undefined. */
export function getApiStatusCode(error: unknown): number | undefined {
  return readEnvelope(error)?.statusCode;
}

/**
 * Resolve a user-facing message using the contract precedence: errorCode → status → message.
 * `byCode` maps a stable error code to a localized string; `fallback` is used last.
 */
export function resolveErrorMessage(
  error: unknown,
  byCode: Partial<Record<string, string>>,
  fallback: string,
): string {
  const env = readEnvelope(error);
  if (env?.errorCode && byCode[env.errorCode]) return byCode[env.errorCode] as string;
  // Never fall back to the backend message for UI — it is a debug payload only (code-first contract).
  return fallback;
}

// Centralized Vietnamese copy for application-domain error codes. Single source so screens never
// branch on localized message text (INV-012) and stay consistent with the backend ERROR-CONTRACT.
export const APPLICATION_ERROR_MESSAGES: Partial<Record<string, string>> = {
  [ERROR_CODES.ApplicationAlreadyActive]: "Bạn đang có một đơn ứng tuyển còn hiệu lực cho vị trí này.",
  [ERROR_CODES.ApplicationAlreadyHired]: "Bạn đã được tuyển cho vị trí này nên không thể ứng tuyển lại.",
  [ERROR_CODES.JobNotAcceptingApplications]: "Vị trí này hiện không nhận hồ sơ mới.",
  [ERROR_CODES.JobDeadlinePassed]: "Đã hết hạn nộp hồ sơ cho vị trí này.",
  [ERROR_CODES.CandidateProfileIncomplete]: "Hồ sơ của bạn còn thiếu thông tin liên hệ bắt buộc.",
  [ERROR_CODES.ResumeRequired]: "Vui lòng tải lên CV mới nhất trước khi ứng tuyển.",
  [ERROR_CODES.ApplicationNotFound]: "Không tìm thấy hồ sơ ứng tuyển.",
  [ERROR_CODES.ApplicationNotWithdrawable]: "Đơn ứng tuyển này không thể rút lại ở trạng thái hiện tại.",
  [ERROR_CODES.InvalidApplicationTransition]: "Thao tác chuyển trạng thái không hợp lệ.",
  [ERROR_CODES.InterviewNotActionable]: "Không thể thao tác phỏng vấn ở trạng thái hiện tại của hồ sơ.",
  [ERROR_CODES.OfferNotActionable]: "Offer hiện không ở trạng thái có thể phản hồi.",
  [ERROR_CODES.InterviewRequired]: "Hãy lên lịch phỏng vấn trước khi gửi offer hoặc từ chối.",
  [ERROR_CODES.InterviewNotCompleted]: "Hãy hoàn tất phỏng vấn trước khi gửi offer hoặc từ chối.",
  [ERROR_CODES.EmailRequiredForOffer]: "Vui lòng gửi email offer thay vì đổi trạng thái trực tiếp.",
  [ERROR_CODES.EmailRequiredForRejection]: "Vui lòng gửi email từ chối thay vì đổi trạng thái trực tiếp.",
  [ERROR_CODES.EmailSendFailed]: "Không gửi được email; trạng thái hồ sơ chưa thay đổi.",
};

/** Resolve an application-domain error to Vietnamese copy (errorCode → status → message → fallback). */
export function getApplicationErrorMessage(error: unknown, fallback: string): string {
  return resolveErrorMessage(error, APPLICATION_ERROR_MESSAGES, fallback);
}

/**
 * Generic toast message resolver. Resolves the backend error CODE to FE-localized copy (never the
 * backend message text — code-first contract). Falls back to the caller's message when the code has
 * no dedicated copy. Prefer `appToast`/`getErrorMessage` in new code.
 */
export function getToastErrorMessage(
  error: unknown,
  fallback = "Có lỗi xảy ra, vui lòng thử lại.",
): string {
  const normalized = normalizeApiError(error);
  const generic = translate(`errors.${ERROR_CODES.UnexpectedError}`);
  const localized = getErrorMessage(normalized.code);
  return localized && localized !== generic ? localized : fallback;
}

// Centralized Vietnamese copy for the ownership / job-approval + cross-cutting auth codes. These back
// the job status-change actions (approve / reject / close / reopen) that route through the guarded
// PATCH /api/hr/jobs/{id}/status endpoint (BR-OWN-003).
export const JOB_STATUS_ERROR_MESSAGES: Partial<Record<string, string>> = {
  [ERROR_CODES.Forbidden]:
    "Bạn không có quyền duyệt hoặc từ chối tin tuyển dụng này.",
  [ERROR_CODES.DepartmentHeadRequired]:
    "Phòng ban này chưa có trưởng bộ phận nên chưa thể duyệt tin tuyển dụng.",
  [ERROR_CODES.InvalidDepartmentHead]:
    "Người được chọn làm trưởng bộ phận phải là tài khoản có vai trò Trưởng bộ phận.",
  [ERROR_CODES.DepartmentNotFound]:
    "Không tìm thấy phòng ban tương ứng với tin tuyển dụng này.",
  [ERROR_CODES.InvalidJobRecruiter]:
    "Người phụ trách được chọn phải là tài khoản có vai trò HR.",
  [ERROR_CODES.JobRecruiterRequired]:
    "Tin tuyển dụng cần có người phụ trách (recruiter) trước khi thực hiện thao tác này.",
  [ERROR_CODES.InvalidJobTransition]:
    "Không thể chuyển tin tuyển dụng sang trạng thái này.",
  [ERROR_CODES.ValidationError]:
    "Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.",
  [ERROR_CODES.Unauthenticated]:
    "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
};

// Status-only fallbacks for the job status-change flow. The backend returns 404 (and sometimes 422)
// without a stable errorCode (ERROR-CONTRACT.md), so we map on HTTP status when no code is present.
const JOB_STATUS_MESSAGE_BY_HTTP: Partial<Record<number, string>> = {
  401: "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
  403: "Bạn không có quyền duyệt hoặc từ chối tin tuyển dụng này.",
  404: "Không tìm thấy tin tuyển dụng này.",
};

/**
 * Resolve a job status-change error (approve / reject / close / reopen) to Vietnamese copy.
 * Precedence: stable errorCode → known HTTP status → backend localized message → fallback.
 * Never surfaces raw exception text when a structured code/status is available (INV-012).
 */
export function getJobStatusErrorMessage(error: unknown, fallback: string): string {
  const env = readEnvelope(error);
  if (env?.errorCode && JOB_STATUS_ERROR_MESSAGES[env.errorCode]) {
    return JOB_STATUS_ERROR_MESSAGES[env.errorCode] as string;
  }
  if (env?.statusCode && JOB_STATUS_MESSAGE_BY_HTTP[env.statusCode]) {
    return JOB_STATUS_MESSAGE_BY_HTTP[env.statusCode] as string;
  }
  // Never fall back to the backend message for UI (code-first contract).
  return fallback;
}

// =============================================================================================
// Code-first error contract: normalize any thrown error into a stable shape and map code → copy.
// =============================================================================================

export type ApiErrorType =
  | "VALIDATION_ERROR"
  | "BAD_REQUEST"
  | "AUTH_ERROR"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BUSINESS_ERROR"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "ERROR";

export type NormalizedFieldError = {
  field: string;
  code: string;
  backendMessage?: string;
  params?: Record<string, unknown>;
};

export type NormalizedGlobalError = {
  code: string;
  backendMessage?: string;
  params?: Record<string, unknown>;
};

/**
 * A backend error normalized for the frontend. The UI branches on `type`/`code` and renders copy from
 * the i18n `errors.*` namespace via {@link getErrorMessage}. `backendMessage` is retained ONLY for
 * dev logging — it must never be rendered in the web UI (code-first contract).
 */
export type NormalizedApiError = {
  type: ApiErrorType;
  code: string;
  backendMessage?: string;
  fieldErrors: NormalizedFieldError[];
  globalErrors: NormalizedGlobalError[];
  status?: number;
  traceId?: string;
  isValidationLike: boolean;
  isServerLike: boolean;
};

/**
 * Resolve an error CODE to localized copy from the i18n `errors.*` namespace. `{param}` placeholders are
 * interpolated. Unknown codes fall back to UNEXPECTED_ERROR. This is the FE's single code → message map;
 * never render the backend message. (`locale` defers to the app-wide i18n locale.)
 */
export function getErrorMessage(
  code: string,
  params?: Record<string, unknown>,
  _locale?: string,
): string {
  const key = `errors.${code}`;
  const vars = params as TranslateVars | undefined;
  const resolved = translate(key, vars);
  if (resolved !== key) return resolved;
  return translate(`errors.${ERROR_CODES.UnexpectedError}`, vars);
}

type NestedApiError = {
  type?: string;
  code?: string;
  message?: string;
  fieldErrors?: Array<{ field?: string; code?: string; message?: string; params?: Record<string, unknown> }>;
  globalErrors?: Array<{ code?: string; message?: string; params?: Record<string, unknown> }>;
  traceId?: string;
};

type FullEnvelope = {
  error?: NestedApiError;
  errorCode?: string | null;
  statusCode?: number;
  message?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
};

function typeFromStatus(status: number | undefined, hasFieldErrors: boolean): ApiErrorType {
  switch (status) {
    case 400:
      return hasFieldErrors ? "VALIDATION_ERROR" : "BAD_REQUEST";
    case 401:
      return "AUTH_ERROR";
    case 403:
      return "FORBIDDEN";
    case 404:
      return "NOT_FOUND";
    case 409:
      return "CONFLICT";
    case 422:
      return "BUSINESS_ERROR";
    default:
      return status !== undefined && status >= 500 ? "SERVER_ERROR" : "ERROR";
  }
}

function codeFromStatus(status: number | undefined): string {
  switch (status) {
    case 400:
      return ERROR_CODES.InvalidInput;
    case 401:
      return ERROR_CODES.Unauthenticated;
    case 403:
      return ERROR_CODES.Forbidden;
    case 404:
      return ERROR_CODES.EntityNotFound;
    case 409:
      return ERROR_CODES.Conflict;
    case 422:
      return ERROR_CODES.BusinessRuleViolation;
    default:
      return status !== undefined && status >= 500
        ? ERROR_CODES.ServerError
        : ERROR_CODES.UnexpectedError;
  }
}

/**
 * Normalize any error (axios error, thrown envelope, network/timeout) into {@link NormalizedApiError}.
 * Prefers the nested `error` block (code-first contract) and falls back to the legacy flat envelope
 * (errorCode/message/errors) so un-migrated endpoints still work.
 */
export function normalizeApiError(error: unknown): NormalizedApiError {
  const axiosLike = error as
    | { code?: string; response?: { data?: unknown; status?: number }; data?: unknown }
    | undefined;

  // Transport-level failure: ONLY a genuine axios error with no response is network/timeout. A plain
  // `throw new Error(...)` (e.g. a "reload failed" guard) must NOT be mislabeled as a network error —
  // it falls through to the generic UNEXPECTED_ERROR path below.
  if (axios.isAxiosError(error) && !error.response) {
    const isTimeout = error.code === "ECONNABORTED" || error.code === "ETIMEDOUT";
    return {
      type: isTimeout ? "TIMEOUT_ERROR" : "NETWORK_ERROR",
      code: isTimeout ? ERROR_CODES.TimeoutError : ERROR_CODES.NetworkError,
      fieldErrors: [],
      globalErrors: [],
      isValidationLike: false,
      isServerLike: true,
    };
  }

  const status = axiosLike?.response?.status;
  const data = (axiosLike?.response?.data ?? axiosLike?.data) as FullEnvelope | undefined;
  const nested = data?.error;

  const fieldErrors: NormalizedFieldError[] = nested?.fieldErrors?.length
    ? nested.fieldErrors.map((f) => ({
        field: f.field ?? "",
        code: f.code ?? ERROR_CODES.ValidationFailed,
        backendMessage: f.message,
        params: f.params,
      }))
    : Object.entries(data?.errors ?? {}).map(([field, messages]) => ({
        field,
        code: ERROR_CODES.ValidationFailed,
        backendMessage: Array.isArray(messages) ? messages[0] : undefined,
      }));

  const globalErrors: NormalizedGlobalError[] = (nested?.globalErrors ?? []).map((g) => ({
    code: g.code ?? ERROR_CODES.FormInvalid,
    backendMessage: g.message,
    params: g.params,
  }));

  const code = nested?.code ?? data?.errorCode ?? codeFromStatus(status);
  const type = (nested?.type as ApiErrorType | undefined) ?? typeFromStatus(status, fieldErrors.length > 0);
  const isServerLike = type === "SERVER_ERROR" || (status !== undefined && status >= 500);
  const isValidationLike =
    type === "VALIDATION_ERROR" || fieldErrors.length > 0 || code === ERROR_CODES.ValidationFailed;

  return {
    type,
    code,
    backendMessage: nested?.message ?? data?.message,
    fieldErrors,
    globalErrors,
    status,
    traceId: nested?.traceId ?? data?.traceId,
    isValidationLike,
    isServerLike,
  };
}
