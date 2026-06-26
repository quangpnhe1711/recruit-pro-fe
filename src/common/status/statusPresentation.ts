// Shared presentation contract for all status domains. Screens render badges/labels through these
// helpers; they never hardcode status copy or branch on localized labels.

import {
  ApplicationStatus,
  normalizeApplicationStatus,
} from "./applicationStatus";
import {
  getApplicationStatusMeta,
} from "../utils/applicationPresentation";

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

// Application status presentation. Label + badge classes reuse the existing canonical map
// (applicationPresentation), augmented with a semantic tone.
export function getApplicationStatusPresentation(
  value: unknown,
  variant: "default" | "candidate" | "detail" = "default",
): StatusPresentation {
  const meta = getApplicationStatusMeta(typeof value === "string" ? value : "", variant);
  const canonical = normalizeApplicationStatus(value) ?? ApplicationStatus.Rejected;
  return {
    label: meta.label,
    tone: APPLICATION_STATUS_TONE[canonical],
    badgeClassName: meta.className,
  };
}

export { getJobStatusPresentation } from "./jobStatus";
export { getInterviewStatusPresentation } from "./interviewStatus";
export { getOfferStatusPresentation } from "./offerStatus";
