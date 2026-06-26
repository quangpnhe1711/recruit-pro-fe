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
  return env?.message ?? fallback;
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
};

/** Resolve an application-domain error to Vietnamese copy (errorCode → status → message → fallback). */
export function getApplicationErrorMessage(error: unknown, fallback: string): string {
  return resolveErrorMessage(error, APPLICATION_ERROR_MESSAGES, fallback);
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
  return env?.message ?? fallback;
}
