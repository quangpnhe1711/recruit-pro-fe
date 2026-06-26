export type ApplicationStatusKey =
  | "applied"
  | "screening"
  | "managerreview"
  | "interview"
  | "offer"
  | "hired"
  | "rejected"
  | "offerdeclined"
  | "withdrawn"
  | "unknown";

export type ApplicationStatusLabel =
  | "Đã ứng tuyển"
  | "Sàng lọc"
  | "QL xét duyệt"
  | "Phỏng vấn"
  | "Offer"
  | "Đã nhận việc"
  | "Từ chối"
  | "Từ chối offer"
  | "Đã rút đơn"
  | "Không xác định";

type ApplicationStatusVariant = "default" | "candidate" | "detail";

type ApplicationStatusMeta = {
  key: ApplicationStatusKey;
  label: ApplicationStatusLabel;
  classes: Record<ApplicationStatusVariant, string>;
};

const APPLICATION_STATUS_META: Record<ApplicationStatusKey, ApplicationStatusMeta> = {
  applied: {
    key: "applied",
    label: "Đã ứng tuyển",
    classes: {
      default: "bg-slate-50 text-slate-700 border-slate-100",
      candidate: "bg-slate-50 text-slate-700",
      detail: "bg-slate-50 text-slate-700 border-slate-200",
    },
  },
  screening: {
    key: "screening",
    label: "Sàng lọc",
    classes: {
      default: "bg-amber-50 text-amber-700 border-amber-100",
      candidate: "bg-amber-50 text-amber-700",
      detail: "bg-amber-50 text-amber-700 border-amber-200",
    },
  },
  managerreview: {
    key: "managerreview",
    label: "QL xét duyệt",
    classes: {
      default: "bg-emerald-50 text-emerald-700 border-emerald-100",
      candidate: "bg-emerald-50 text-emerald-700",
      detail: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
  },
  interview: {
    key: "interview",
    label: "Phỏng vấn",
    classes: {
      default: "bg-sky-50 text-sky-700 border-sky-100",
      candidate: "bg-sky-50 text-sky-700",
      detail: "bg-sky-50 text-sky-700 border-sky-200",
    },
  },
  offer: {
    key: "offer",
    label: "Offer",
    classes: {
      default: "bg-violet-50 text-violet-700 border-violet-100",
      candidate: "bg-violet-50 text-violet-700",
      detail: "bg-violet-50 text-violet-700 border-violet-200",
    },
  },
  hired: {
    key: "hired",
    label: "Đã nhận việc",
    classes: {
      default: "bg-green-50 text-green-700 border-green-100",
      candidate: "bg-green-50 text-green-700",
      detail: "bg-green-50 text-green-700 border-green-200",
    },
  },
  rejected: {
    key: "rejected",
    label: "Từ chối",
    classes: {
      default: "bg-rose-50 text-rose-700 border-rose-100",
      candidate: "bg-rose-50 text-rose-700",
      detail: "bg-red-50 text-red-700 border-red-200",
    },
  },
  offerdeclined: {
    key: "offerdeclined",
    label: "Từ chối offer",
    classes: {
      default: "bg-stone-100 text-stone-700 border-stone-200",
      candidate: "bg-stone-100 text-stone-700",
      detail: "bg-stone-100 text-stone-700 border-stone-300",
    },
  },
  // Withdrawal is candidate-initiated and non-punitive — render it as a neutral state, never
  // as the red "Từ chối" (rejected) badge it used to collapse into.
  withdrawn: {
    key: "withdrawn",
    label: "Đã rút đơn",
    classes: {
      default: "bg-slate-100 text-slate-600 border-slate-200",
      candidate: "bg-slate-100 text-slate-600",
      detail: "bg-slate-100 text-slate-600 border-slate-300",
    },
  },
  // Safe fallback for any unrecognized status — NEUTRAL, never the red "Từ chối" (rejected) badge.
  // An unknown status must never be presented as a company rejection.
  unknown: {
    key: "unknown",
    label: "Không xác định",
    classes: {
      default: "bg-slate-100 text-slate-600 border-slate-200",
      candidate: "bg-slate-100 text-slate-600",
      detail: "bg-slate-100 text-slate-600 border-slate-300",
    },
  },
};

export const applicationStatusOptions: ApplicationStatusLabel[] = [
  "Đã ứng tuyển",
  "Sàng lọc",
  "QL xét duyệt",
  "Phỏng vấn",
  "Offer",
  "Đã nhận việc",
  "Từ chối",
  "Từ chối offer",
  "Đã rút đơn",
];

export const applicationStatusFilterOptions = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Đã ứng tuyển", value: "applied" },
  { label: "Sàng lọc", value: "screening" },
  { label: "QL xét duyệt", value: "managerreview" },
  { label: "Phỏng vấn", value: "interview" },
  { label: "Offer", value: "offer" },
  { label: "Đã nhận việc", value: "hired" },
  { label: "Từ chối", value: "rejected" },
  { label: "Từ chối offer", value: "offerdeclined" },
  { label: "Đã rút đơn", value: "withdrawn" },
];

export function normalizeApplicationStatusKey(status: string): ApplicationStatusKey {
  switch (status.trim().toLowerCase().replace(/[_\s-]+/g, "")) {
    case "applied":
    case "pending":
      return "applied";
    case "screening":
    case "hrscreening":
    case "reviewing":
    case "underreview":
      return "screening";
    case "managerreview":
    case "finalreview":
      return "managerreview";
    case "interview":
    case "interviewscheduled":
    case "interviewing":
      return "interview";
    case "offer":
    case "waitingoffer":
    case "offersent":
    case "offered":
      return "offer";
    case "hired":
    case "accepted":
      return "hired";
    case "offerdeclined":
    case "declined":
      return "offerdeclined";
    // Match both the raw enum ("Withdrawn") and the localized candidate label ("Đã rút đơn",
    // which normalizes to "đãrútđơn" once spaces are stripped).
    case "withdrawn":
    case "withdraw":
    case "đãrútđơn":
    case "rútđơn":
      return "withdrawn";
    case "rejected":
      return "rejected";
    // Unknown/unrecognized → neutral "unknown", NEVER "rejected" (INV-012). A localized status label
    // (e.g. "HR đang sàng lọc") that slips through must not be mislabeled as a company rejection.
    default:
      return "unknown";
  }
}

export function getApplicationStatusMeta(
  status: string,
  variant: ApplicationStatusVariant = "default",
): ApplicationStatusMeta & { className: string } {
  const key = normalizeApplicationStatusKey(status);
  const meta = APPLICATION_STATUS_META[key];

  return {
    ...meta,
    className: meta.classes[variant],
  };
}

export function formatApplicationStatus(status: string): ApplicationStatusLabel {
  return getApplicationStatusMeta(status).label;
}

export function getApplicationStatusBadgeClass(
  status: string,
  variant: ApplicationStatusVariant = "default",
): string {
  return getApplicationStatusMeta(status, variant).className;
}

export function getDepartmentBadgeClass(department: string): string {
  switch (department) {
    case "Engineering":
      return "bg-[#005f93]/10 text-[#005f93]";
    case "Marketing":
      return "bg-secondary-container/50 text-secondary";
    case "Sales":
      return "bg-green-100 text-green-700";
    case "Human Resources":
      return "bg-purple-100 text-purple-700";
    case "Operations":
    case "Product":
    case "Data & Analytics":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
