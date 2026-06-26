// Canonical InterviewStatus domain for the frontend.
//
// Mirrors RecruitPro.Domain.Enums.InterviewStatus (Scheduled, Completed, Canceled — single "l").
// IMPORTANT: the scheduling form's local draft state is NOT an interview status. Keep them separate:
// use InterviewDraftState for the unsaved form, InterviewStatus for persisted server values.

import type { StatusTone } from "./statusPresentation";

export const InterviewStatus = {
  Scheduled: "Scheduled",
  Completed: "Completed",
  Canceled: "Canceled",
} as const;

export type InterviewStatus = (typeof InterviewStatus)[keyof typeof InterviewStatus];

// Local-only form state for the schedule screen. Never persisted as an InterviewStatus.
export type InterviewDraftState = "draft" | "readyToSubmit";

const INTERVIEW_STATUS_VALUES = new Set<string>(Object.values(InterviewStatus));

export function isInterviewStatus(value: unknown): value is InterviewStatus {
  return typeof value === "string" && INTERVIEW_STATUS_VALUES.has(value);
}

export function normalizeInterviewStatus(value: unknown): InterviewStatus | null {
  if (typeof value !== "string") return null;
  switch (value.trim().toLowerCase().replace(/[_\s-]+/g, "")) {
    case "scheduled":
    case "confirmed":
      return InterviewStatus.Scheduled;
    case "completed":
      return InterviewStatus.Completed;
    case "canceled":
    case "cancelled":
      return InterviewStatus.Canceled;
    default:
      return null;
  }
}

type InterviewStatusPresentation = {
  label: string;
  tone: StatusTone;
};

const INTERVIEW_STATUS_PRESENTATION: Record<InterviewStatus, InterviewStatusPresentation> = {
  Scheduled: { label: "Đã lên lịch", tone: "info" },
  Completed: { label: "Hoàn thành", tone: "success" },
  Canceled: { label: "Đã hủy", tone: "neutral" },
};

export function getInterviewStatusPresentation(value: unknown): InterviewStatusPresentation {
  const status = normalizeInterviewStatus(value);
  if (status) return INTERVIEW_STATUS_PRESENTATION[status];
  return { label: typeof value === "string" && value ? value : "Không rõ", tone: "neutral" };
}
