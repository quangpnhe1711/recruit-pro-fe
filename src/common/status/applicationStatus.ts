// Canonical ApplicationStatus domain for the frontend.
//
// Mirrors RecruitPro.Domain.Enums.ApplicationStatus and the canonical state groups in
// docs/source-of-truth/00-DOMAIN-STATE-DEPENDENCY.md. This is the ONLY place raw status string
// literals ("Applied", "Withdrawn", …) may appear for logic. Screen components must branch on the
// constants/helpers below, never on `status === "Withdrawn"` or on localized Vietnamese labels.

export const ApplicationStatus = {
  Applied: "Applied",
  Screening: "Screening",
  ManagerReview: "ManagerReview",
  Interview: "Interview",
  Offer: "Offer",
  Hired: "Hired",
  Rejected: "Rejected",
  OfferDeclined: "OfferDeclined",
  Withdrawn: "Withdrawn",
} as const;

export type ApplicationStatus =
  (typeof ApplicationStatus)[keyof typeof ApplicationStatus];

// Canonical state groups (00-DOMAIN-STATE-DEPENDENCY §3).
export const ACTIVE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.Applied,
  ApplicationStatus.Screening,
  ApplicationStatus.ManagerReview,
  ApplicationStatus.Interview,
  ApplicationStatus.Offer,
];

export const CLOSED_FOR_WORKFLOW_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.Rejected,
  ApplicationStatus.Withdrawn,
  ApplicationStatus.OfferDeclined,
  ApplicationStatus.Hired,
];

export const REAPPLY_ELIGIBLE_CLOSED_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.Rejected,
  ApplicationStatus.Withdrawn,
  ApplicationStatus.OfferDeclined,
];

export const WITHDRAWABLE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.Applied,
  ApplicationStatus.Screening,
  ApplicationStatus.ManagerReview,
  ApplicationStatus.Interview,
];

export const OFFER_ACTIONABLE_APPLICATION_STATUSES: readonly ApplicationStatus[] = [
  ApplicationStatus.Offer,
];

const APPLICATION_STATUS_VALUES = new Set<string>(Object.values(ApplicationStatus));

export function isApplicationStatus(value: unknown): value is ApplicationStatus {
  return typeof value === "string" && APPLICATION_STATUS_VALUES.has(value);
}

// Maps any backend/legacy/localized string to a canonical ApplicationStatus, or null if unknown.
// Accepts enum casings, legacy aliases, and the localized candidate labels as a defensive fallback
// for dirty data — but callers should treat a canonical value as the contract.
export function normalizeApplicationStatus(value: unknown): ApplicationStatus | null {
  if (typeof value !== "string") return null;
  switch (value.trim().toLowerCase().replace(/[_\s-]+/g, "")) {
    case "applied":
    case "pending":
      return ApplicationStatus.Applied;
    case "screening":
    case "hrscreening":
    case "reviewing":
    case "underreview":
      return ApplicationStatus.Screening;
    case "managerreview":
    case "finalreview":
      return ApplicationStatus.ManagerReview;
    case "interview":
    case "interviewscheduled":
    case "interviewing":
      return ApplicationStatus.Interview;
    case "offer":
    case "waitingoffer":
    case "offersent":
    case "offered":
      return ApplicationStatus.Offer;
    case "hired":
    case "accepted":
      return ApplicationStatus.Hired;
    case "offerdeclined":
    case "declined":
      return ApplicationStatus.OfferDeclined;
    case "withdrawn":
    case "withdraw":
    case "đãrútđơn":
    case "rútđơn":
      return ApplicationStatus.Withdrawn;
    case "rejected":
      return ApplicationStatus.Rejected;
    default:
      return null;
  }
}

export function isActiveApplicationStatus(status: ApplicationStatus): boolean {
  return ACTIVE_APPLICATION_STATUSES.includes(status);
}

export function isClosedForWorkflowApplicationStatus(status: ApplicationStatus): boolean {
  return CLOSED_FOR_WORKFLOW_APPLICATION_STATUSES.includes(status);
}

export function isReapplyEligibleClosedApplicationStatus(status: ApplicationStatus): boolean {
  return REAPPLY_ELIGIBLE_CLOSED_APPLICATION_STATUSES.includes(status);
}

export function isWithdrawableApplicationStatus(status: ApplicationStatus): boolean {
  return WITHDRAWABLE_APPLICATION_STATUSES.includes(status);
}

export function canShowOfferActions(status: ApplicationStatus): boolean {
  return OFFER_ACTIONABLE_APPLICATION_STATUSES.includes(status);
}
