import type { UserDto } from "../auth/authSchema";

export type DepartmentDto = {
  id: string;
  name: string;
  description: string | null;
};

export type SkillDto = {
  id: string;
  name: string;
};

export type JobSkillDto = {
  skill: SkillDto;
  minYearsExperience: number | null;
  isRequired: boolean;
};

export type EmploymentType =
  | "FULL_TIME"
  | "PART_TIME"
  | "INTERNSHIP"
  | "CONTRACT";

export type WorkMode = "ONSITE" | "HYBRID" | "REMOTE";

export type JobStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "CLOSED"
  | "REJECTED";

export type JobListItemDto = {
  id: string;
  title: string;
  department: DepartmentDto;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minExperienceYears: number;
  vacancyCount: number;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string | null;
  status: JobStatus;
  createdAt: string;
  createdBy: UserDto;
  approvedBy: UserDto | null;
  applicationCount: number;
  availableActions: string[];
};

export type JobFunnelStageDto = {
  label: string;
  count: number;
  color: string;
};

export type ApplicationCandidateSummaryDto = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  currentPosition: string | null;
};

export type ApplicationJobSummaryDto = {
  id: string;
  title: string;
  department: DepartmentDto;
};

export type ApplicationListItemDto = {
  id: string;
  candidate: ApplicationCandidateSummaryDto;
  job: ApplicationJobSummaryDto;
  status:
    | "PENDING"
    | "REVIEWING"
    | "INTERVIEWING"
    | "MANAGER_REVIEW"
    | "ACCEPTED"
    | "REJECTED";
  appliedAt: string;
  reviewedBy: UserDto | null;
  nextStep: string | null;
};

export type JobDetailDto = {
  id: string;
  title: string;
  department: DepartmentDto;
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minExperienceYears: number;
  vacancyCount: number;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string | null;
  status: JobStatus;
  createdAt: string;
  description: string;
  requirements: string[];
  benefits: string[];
  skills: JobSkillDto[];
  summary: string;
  hiringManager: UserDto | null;
  applicationCount: number;
  recentApplications: ApplicationListItemDto[];
  hiringFunnel: JobFunnelStageDto[];
  availableActions: string[];
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PublicJobQueryParams = {
  search?: string | null;
  departmentId?: string | null;
  workMode?: WorkMode | null;
  employmentType?: EmploymentType | null;
  status?: JobStatus | null;
  page?: number;
  pageSize?: number;
};

export type HrJobQueryParams = {
  departmentId?: string | null;
  status?: JobStatus | null;
  page?: number;
  pageSize?: number;
};

export type CreateJobRequest = {
  departmentId: string;
  title: string;
  description: string;
  requirements: string[];
  benefits: string[];
  location: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minExperienceYears: number;
  vacancyCount: number;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string | null;
  skillIds: string[];
};

export type UpdateJobRequest = Partial<CreateJobRequest> & {
  status?: JobStatus | null;
};

export type UpdateJobStatusRequest = {
  status: JobStatus;
};

export const jobStatusLabels: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

export const workModeLabels: Record<WorkMode, string> = {
  ONSITE: "On-site",
  HYBRID: "Hybrid",
  REMOTE: "Remote",
};
