// Canonical JobStatus domain for the frontend.
//
// Mirrors RecruitPro.Domain.Enums.JobStatus (Draft, PendingApproval, Approved, Closed, Rejected).
// The frontend has historically seen ALL_CAPS forms (DRAFT, PENDING_APPROVAL, …) from the job DTOs;
// normalizeJobStatus accepts both and returns the canonical PascalCase value. Only Approved jobs
// accept applications (BR-APPLICATION-004 / INV-001).

import type { StatusTone } from "./statusPresentation";

export const JobStatus = {
  Draft: "Draft",
  PendingApproval: "PendingApproval",
  Approved: "Approved",
  Closed: "Closed",
  Rejected: "Rejected",
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

const JOB_STATUS_VALUES = new Set<string>(Object.values(JobStatus));

export function isJobStatus(value: unknown): value is JobStatus {
  return typeof value === "string" && JOB_STATUS_VALUES.has(value);
}

export function normalizeJobStatus(value: unknown): JobStatus | null {
  if (typeof value !== "string") return null;
  switch (value.trim().toLowerCase().replace(/[_\s-]+/g, "")) {
    case "draft":
      return JobStatus.Draft;
    case "pendingapproval":
    case "pending":
      return JobStatus.PendingApproval;
    case "approved":
      return JobStatus.Approved;
    case "closed":
      return JobStatus.Closed;
    case "rejected":
      return JobStatus.Rejected;
    default:
      return null;
  }
}

// Only Approved jobs accept applications (deadline is checked separately by the caller).
export function isOpenForApplicationJobStatus(status: JobStatus): boolean {
  return status === JobStatus.Approved;
}

type JobStatusPresentation = {
  label: string;
  tone: StatusTone;
};

// Canonical English display labels for JobStatus (status contract: badges/columns/filters render
// English; Vietnamese is reserved for guidance/helper copy). An unrecognized value resolves to a
// neutral "Unknown" — it must never collapse to Rejected.
const JOB_STATUS_PRESENTATION: Record<JobStatus, JobStatusPresentation> = {
  Draft: { label: "Draft", tone: "neutral" },
  PendingApproval: { label: "Pending Approval", tone: "warning" },
  Approved: { label: "Approved", tone: "success" },
  Closed: { label: "Closed", tone: "neutral" },
  Rejected: { label: "Rejected", tone: "danger" },
};

export function getJobStatusPresentation(value: unknown): JobStatusPresentation {
  const status = normalizeJobStatus(value);
  if (status) return JOB_STATUS_PRESENTATION[status];
  return { label: "Unknown", tone: "neutral" };
}

// Stable filter keys for job-status filters ("all" + canonical values). Labels come from
// getJobStatusPresentation so screens never branch on Vietnamese text.
export const jobStatusFilterOptions: { label: string; value: "all" | JobStatus }[] = [
  { label: "All statuses", value: "all" },
  { label: getJobStatusPresentation(JobStatus.Draft).label, value: JobStatus.Draft },
  { label: getJobStatusPresentation(JobStatus.PendingApproval).label, value: JobStatus.PendingApproval },
  { label: getJobStatusPresentation(JobStatus.Approved).label, value: JobStatus.Approved },
  { label: getJobStatusPresentation(JobStatus.Closed).label, value: JobStatus.Closed },
  { label: getJobStatusPresentation(JobStatus.Rejected).label, value: JobStatus.Rejected },
];
