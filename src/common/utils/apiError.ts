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
