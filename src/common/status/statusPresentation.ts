// Shared presentation contract for all status domains. Screens render badges/labels through these
// helpers; they never hardcode status copy or branch on localized labels.

import {
  ApplicationStatus,
  normalizeApplicationStatus,
} from "./applicationStatus";

export type StatusTone =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "primary";

export type StatusPresentation = {
  label: string;
  tone: StatusTone;
  badgeClassName: string;
  description?: string;
};

// Tailwind badge classes per tone (kept consistent with the existing application badge palette).
const TONE_BADGE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-slate-100 text-slate-600 border border-slate-200",
  info: "bg-sky-50 text-sky-700 border border-sky-100",
  warning: "bg-amber-50 text-amber-700 border border-amber-100",
  success: "bg-green-50 text-green-700 border border-green-100",
  danger: "bg-rose-50 text-rose-700 border border-rose-100",
  primary: "bg-violet-50 text-violet-700 border border-violet-100",
};

export function toneBadgeClassName(tone: StatusTone): string {
  return TONE_BADGE_CLASS[tone];
}

// Tone per ApplicationStatus. Withdrawn is deliberately neutral and distinct from Rejected (danger)
// and OfferDeclined (neutral) — INV-004.
const APPLICATION_STATUS_TONE: Record<ApplicationStatus, StatusTone> = {
  Applied: "neutral",
  Screening: "warning",
  ManagerReview: "success",
  Interview: "info",
  Offer: "primary",
  Hired: "success",
  Rejected: "danger",
  OfferDeclined: "neutral",
  Withdrawn: "neutral",
};

// Canonical English display labels for ApplicationStatus. Statuses stay English (user preference);
// ManagerReview presents as "Head Review" (= the DepartmentHeadReview business stage — the enum value
// is NOT renamed). Localized explanatory text (nextStep) lives elsewhere, not here.
const APPLICATION_STATUS_ENGLISH_LABEL: Record<ApplicationStatus, string> = {
  Applied: "Applied",
  Screening: "Screening",
  ManagerReview: "Head Review",
  Interview: "Interview",
  Offer: "Offer",
  Hired: "Hired",
  Rejected: "Rejected",
  OfferDeclined: "Offer Declined",
  Withdrawn: "Withdrawn",
};

// Application status presentation. Branches ONLY on the canonical status (never a localized label).
// An unknown/unrecognized value resolves to a NEUTRAL "Unknown" — it must never collapse to Rejected
// (the prior `?? Rejected` fallback was the source of the "Từ chối" mislabel bug).
export function getApplicationStatusPresentation(value: unknown): StatusPresentation {
  const canonical = normalizeApplicationStatus(value);
  if (!canonical) {
    return {
      label: "Unknown",
      tone: "neutral",
      badgeClassName: toneBadgeClassName("neutral"),
    };
  }

  const tone = APPLICATION_STATUS_TONE[canonical];
  return {
    label: APPLICATION_STATUS_ENGLISH_LABEL[canonical],
    tone,
    badgeClassName: toneBadgeClassName(tone),
  };
}

export { getJobStatusPresentation } from "./jobStatus";
export { getInterviewStatusPresentation } from "./interviewStatus";
export { getOfferStatusPresentation } from "./offerStatus";
