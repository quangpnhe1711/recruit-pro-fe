import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";

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
      label: "Quá hạn",
      className: "bg-[#fff1ef] text-[#ba1a1a]",
    };
  }

  if (now.isSameOrAfter(start) && now.isBefore(end)) {
    return {
      key: "in-progress",
      label: "Đang diễn ra",
      className: "bg-[#e8f5e9] text-[#1b5e20]",
    };
  }

  if (start.isSame(now, "day")) {
    return {
      key: "today",
      label: "Hôm nay",
      className: "bg-[#fff3e0] text-[#9a4d00]",
    };
  }

  if (start.diff(now, "day", true) <= 3) {
    return {
      key: "upcoming",
      label: "Sắp tới",
      className: "bg-[#e3f2fd] text-[#005f93]",
    };
  }

  return null;
}
