import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import { translate } from "../../i18n";

dayjs.extend(isSameOrAfter);

const TERMINAL_INTERVIEW_STATUSES = new Set([
  "completed",
  "canceled",
  "cancelled",
  "rejected",
  "declined",
  "closed",
  "no_show",
  "noshow",
]);

export type InterviewTimingStatusKey =
  | "overdue"
  | "today"
  | "upcoming"
  | "in-progress";

export type InterviewTimingStatus = {
  key: InterviewTimingStatusKey;
  label: string;
  className: string;
};

export function isTerminalInterviewStatus(status?: string | null) {
  return TERMINAL_INTERVIEW_STATUSES.has((status ?? "").trim().toLowerCase());
}

// Badge classes for the post-interview scorecard recommendation (StrongHire..StrongNoHire).
export function recommendationChipClass(recommendation: string): string {
  switch (recommendation) {
    case "StrongHire":
      return "bg-emerald-50 text-emerald-700";
    case "Hire":
      return "bg-sky-50 text-sky-700";
    case "NoHire":
      return "bg-amber-50 text-amber-700";
    case "StrongNoHire":
      return "bg-rose-50 text-rose-700";
    default:
      return "bg-[#f2efed] text-[#5f5e5e]";
  }
}

export function getInterviewTimingStatus(
  startAt?: string | number | Date | null,
  endAt?: string | number | Date | null,
  status?: string | null,
): InterviewTimingStatus | null {
  if (!startAt || isTerminalInterviewStatus(status)) {
    return null;
  }

  const now = dayjs();
  const start = dayjs(startAt);
  const end = endAt ? dayjs(endAt) : start;

  if (!start.isValid() || !end.isValid()) {
    return null;
  }

  if (now.isAfter(end)) {
    return {
      key: "overdue",
      label: translate("candidateInterviews.timing.overdue"),
      className: "bg-[#fff1ef] text-[#ba1a1a]",
    };
  }

  if (now.isSameOrAfter(start) && now.isBefore(end)) {
    return {
      key: "in-progress",
      label: translate("candidateInterviews.timing.inProgress"),
      className: "bg-[#e8f5e9] text-[#1b5e20]",
    };
  }

  if (start.isSame(now, "day")) {
    return {
      key: "today",
      label: translate("candidateInterviews.timing.today"),
      className: "bg-[#fff3e0] text-[#9a4d00]",
    };
  }

  if (start.diff(now, "day", true) <= 3) {
    return {
      key: "upcoming",
      label: translate("candidateInterviews.timing.upcoming"),
      className: "bg-[#e3f2fd] text-[#005f93]",
    };
  }

  return null;
}
