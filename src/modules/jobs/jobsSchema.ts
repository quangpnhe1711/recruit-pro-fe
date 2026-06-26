import type { UserDto } from "../auth/authSchema";

export type DepartmentDto = {
  id: string;
  name: string;
  description: string | null;
  // Department head (Phase 2/3 ownership). Optional/nullable — older payloads and departments without
  // an assigned head omit these. Source: GET /api/departments (DepartmentResponseDto).
  headUserId?: string | null;
  headUserName?: string | null;
  headUserEmail?: string | null;
};

export type SkillDto = {
  id: string;
  name: string;
};

export type JobSkillDto = {
  skill: SkillDto;
  minYearsExperience: number | null;
  isRequired: boolean;
  skillType?: "Required" | "NiceToHave" | string;
  minimumYearsOfExperience?: number | null;
};

export type EmploymentType =
  | "Full-time"
  | "Part-time"
  | "Internship"
  | "Contract";

export type WorkMode = "Onsite" | "Hybrid" | "Remote";

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
  postedAt?: string | null;
  createdBy: UserDto;
  approvedBy: UserDto | null;
  applicationCount: number;
  availableActions: string[];
  tags?: string[];
  skills?: Array<JobSkillDto | SkillDto>;
  shortDescription?: string | null;
  summary?: string | null;
  // Ownership snapshot (Phase 2/3). Optional/nullable — display-only, never required.
  // `createdBy`/`approvedBy` above are audit fields; recruiter + (effective) department head are the
  // business owners (BR-OWN-002/003). Source: GET /api/hr/jobs (HrJobListItemDto).
  recruiterId?: string | null;
  recruiterName?: string | null;
  departmentHeadId?: string | null;
  departmentHeadName?: string | null;
  effectiveDepartmentHeadId?: string | null;
  effectiveDepartmentHeadName?: string | null;
};

// Ownership snapshot for a single job (Phase 2/3). All fields optional/nullable — render with safe
// fallbacks ("Chưa phân công" / "Chưa có trưởng bộ phận"). Source: GET /api/hr/jobs/{id}
// (JobDetailResponseDto). `effectiveDepartmentHead*` falls back to the approver when no head is set.
export type JobOwnershipDto = {
  recruiterId: string | null;
  recruiterName: string | null;
  recruiterEmail: string | null;
  departmentHeadId: string | null;
  departmentHeadName: string | null;
  departmentHeadEmail: string | null;
  effectiveDepartmentHeadId: string | null;
  effectiveDepartmentHeadName: string | null;
  effectiveDepartmentHeadEmail: string | null;
  createdById: string | null;
  createdByName: string | null;
  approvedById: string | null;
  approvedByName: string | null;
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
    | "APPLIED"
    | "Applied"
    | "Pending"
    | "SCREENING"
    | "Screening"
    | "Reviewing"
    | "MANAGER_REVIEW"
    | "ManagerReview"
    | "INTERVIEW"
    | "Interview"
    | "Interviewing"
    | "OFFER"
    | "Offer"
    | "Offered"
    | "HIRED"
    | "Hired"
    | "Accepted"
    | "REJECTED"
    | "OFFER_DECLINED"
    | "OfferDeclined";
  appliedAt: string;
  reviewedBy: UserDto | null;
  score?: number | null;
  nextStep: string | null;
};

export type ApplicationReviewDecision =
  | "Screening"
  | "ManagerReview"
  | "Interview"
  | "Offer"
  | "Rejected";

export type ApplicationReviewDetailDto = {
  applicationId: string;
  referenceCode: string;
  stageLabel: string;
  status: string;
  offerStatus: string | null;
  appliedAt: string | null;
  nextStep: string;
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    currentPosition: string | null;
    experienceYears: number | null;
    education: string | null;
    address: string | null;
    bio: string | null;
    linkedinUrl: string | null;
    githubUrl: string | null;
    skills: string[];
  };
  job: {
    id: string;
    title: string;
    departmentName: string;
    requiredSkills: string[];
  };
  insights: {
    skillsMatchPercent: number;
    matchedSkillCount: number;
    requiredSkillCount: number;
    submittedInterviewNotes: number;
    totalInterviews: number;
  };
  interviews: Array<{
    id: string;
    label: string;
    interviewDate: string;
    status: string;
    notes: string | null;
  }>;
  reviewedBy: UserDto | null;
  // Ownership snapshot (Phase 2/3, BR-OWN-005). Optional/nullable — the assigned recruiter handles the
  // application; the assigned department head is the business approver. Source:
  // GET /api/hr/applications/{id} (ApplicationReviewDetailDto).
  assignedRecruiterId?: string | null;
  assignedRecruiterName?: string | null;
  assignedRecruiterEmail?: string | null;
  assignedDepartmentHeadId?: string | null;
  assignedDepartmentHeadName?: string | null;
  assignedDepartmentHeadEmail?: string | null;
};

export type OfferEditorDto = {
  application: {
    applicationId: string;
    referenceCode: string;
    stageLabel: string;
    candidateName: string;
    candidateEmail: string;
    candidateAvatarUrl: string | null;
    jobTitle: string;
    departmentName: string;
  };
  offer: {
    offerId: string | null;
    status: string;
    offerTemplateId: string | null;
    baseSalary: number;
    currencyCode: string;
    bonusDescription: string | null;
    equityNotes: string | null;
    employmentType: string;
    proposedStartDate: string | null;
    probationPeriod: string | null;
    reportingManagerId: string | null;
    reportingManagerName: string | null;
    personalMessage: string | null;
    benefitIds: string[];
    sentAt: string | null;
    updatedAt: string | null;
  };
  masterData: {
    templates: Array<{
      id: string;
      name: string;
      description: string | null;
    }>;
    benefits: Array<{
      id: string;
      name: string;
      description: string | null;
    }>;
    currencies: Array<{
      code: string;
      name: string;
      symbol: string;
    }>;
    employmentTypes: string[];
    reportingManagers: Array<{
      id: string;
      fullName: string;
      email: string;
      title: string;
    }>;
  };
};

export type UpsertOfferRequest = {
  offerTemplateId?: string | null;
  baseSalary: number;
  currencyCode: string;
  bonusDescription?: string | null;
  equityNotes?: string | null;
  employmentType: string;
  proposedStartDate?: string | null;
  probationPeriod?: string | null;
  reportingManagerId?: string | null;
  personalMessage?: string | null;
  benefitIds: string[];
};

export type ManagerReviewQueueItemDto = {
  applicationId: string;
  candidateName: string;
  candidateInitials: string;
  candidateAvatarUrl: string | null;
  candidateLocation: string;
  jobTitle: string;
  score: number;
  recommendation: string;
  status: string;
  appliedAt: string | null;
  completedInterviews: number;
  totalInterviews: number;
};

export type ManagerReviewQueueResponseDto = {
  items: ManagerReviewQueueItemDto[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    pendingFinalApprovals: number;
    recommendedCount: number;
    flaggedCount: number;
    averageScore: number;
  };
};

export type ManagerJobApprovalQueueItemDto = {
  jobId: string;
  referenceCode: string;
  title: string;
  departmentName: string;
  hiringTeamLabel: string;
  hrOwnerName: string;
  status: string;
  submittedAt: string | null;
  vacancyCount: number;
  requiredSkillsCount: number;
  applicationsCount: number;
  isOverdue: boolean;
};

export type ManagerJobApprovalQueueResponseDto = {
  items: ManagerJobApprovalQueueItemDto[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    pendingApprovals: number;
    submittedToday: number;
    overdueReviews: number;
    departmentsWaiting: number;
  };
};

export type ManagerJobApprovalDetailDto = {
  jobId: string;
  referenceCode: string;
  title: string;
  status: string;
  statusLabel: string;
  submittedAt: string | null;
  submittedAgoLabel: string;
  hrOwner: {
    userId: string;
    fullName: string;
    email: string;
    phone: string | null;
  };
  department: {
    departmentId: string;
    name: string;
    description: string | null;
  };
  location: string;
  workMode: string;
  employmentType: string;
  vacancyCount: number;
  minExperienceYears: number | null;
  salaryMin: number | null;
  salaryMax: number | null;
  deadline: string | null;
  description: string[];
  requirements: string[];
  benefits: string[];
  skills: Array<{
    skillId: string;
    name: string;
    minYearsExperience: number | null;
    isRequired: boolean;
  }>;
  insights: {
    applicationsCount: number;
    activePipelineCount: number;
    requiredSkillsCount: number;
    optionalSkillsCount: number;
    hasSalaryRange: boolean;
  };
  interviewFlow: Array<{
    order: number;
    label: string;
    description: string;
  }>;
  approvalSnapshot: {
    approvedByName: string | null;
    lastUpdatedAt: string | null;
    summary: string;
  } | null;
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
  salaryLabel?: string;
  requirements: string[];
  benefits: string[];
  skills: JobSkillDto[];
  requiredSkills?: JobSkillDto[];
  niceToHaveSkills?: JobSkillDto[];
  summary: string;
  hiringManager: UserDto | null;
  applicationCount: number;
  recentApplications: ApplicationListItemDto[];
  hiringFunnel: JobFunnelStageDto[];
  availableActions: string[];
  // Ownership snapshot (Phase 2/3) — present on the HR job detail; null for public/unauthenticated.
  ownership?: JobOwnershipDto | null;
};

export type ApplyJobScreenDto = {
  job: {
    id: string;
    title: string;
    departmentName: string;
    location: string;
    workMode: WorkMode | string;
    employmentType: EmploymentType | string;
    salaryMin: number | null;
    salaryMax: number | null;
    salaryLabel: string;
    vacancyCount: number;
    status: string;
    deadline: string | null;
  };
  candidateProfile: {
    candidateId: string;
    fullName: string;
    email: string;
    phone: string | null;
    currentPosition: string | null;
    experienceYears: number | null;
    editProfilePath: string;
  };
  resume: {
    resumeId: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  } | null;
  eligibility: {
    canApply: boolean;
    alreadyApplied: boolean;
    existingApplicationId: string | null;
    existingApplicationStatus: string | null;
    blockers: string[];
    guidanceMessage: string;
    // Stable machine code for the primary blocker (null when canApply). Branch on this, not on the
    // localized blocker text.
    primaryErrorCode?: string | null;
  };
};

export type ApplyJobRequestDto = {
  coverLetter?: string | null;
};

export type ApplyJobResponseDto = {
  applicationId: string;
  status: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
};

export type PublicJobQueryParams = {
  keyword?: string | null;
  employmentTypes?: EmploymentType[];
  skills?: string[];
  sortBy?: "newest" | "salaryDesc" | "relevant" | string | null;
  page?: number;
  pageSize?: number;
};

export type JobSearchFilterOption = {
  label: string;
  value: string;
};

export type JobSearchFiltersDto = {
  employmentTypes: JobSearchFilterOption[];
  skills: JobSearchFilterOption[];
};

export type JobStatisticsDto = {
  hiringFunnel?: JobFunnelStageDto[];
  applicationSummary?: {
    funnel?: JobFunnelStageDto[];
  };
};

export type HrJobQueryParams = {
  departmentId?: string | null;
  status?: JobStatus | null;
  createdByUserId?: string | null;
  page?: number;
  pageSize?: number;
};

export type ManagerJobApprovalQueryParams = {
  keyword?: string | null;
  department?: string | null;
  page?: number;
  pageSize?: number;
};

export type CreateJobRequest = {
  title: string;
  departmentId?: string | null;
  department?: string | null;
  employmentType?: EmploymentType | string | null;
  workMode?: WorkMode | string | null;
  location: string;
  shortPitch?: string | null;
  description: string;
  responsibilities?: string[];
  requirements: string[];
  skills?: string[];
  skillIds?: string[];
  skillRequirements?: Array<{
    skillId?: string | null;
    skillName?: string | null;
    skillType: "Required" | "NiceToHave" | string;
    minimumYearsOfExperience?: number | null;
  }>;
  salaryMin: number | null;
  salaryMax: number | null;
  currency?: "VND" | string | null;
  vacancyCount: number;
  minExperienceYears?: number | null;
  benefits?: string[];
  deadline?: string | null;
};

export type UpdateJobRequest = Partial<CreateJobRequest> & {
  status?: JobStatus | null;
};

export type UpdateJobStatusRequest = {
  status: JobStatus;
};

// Canonical English job-status display labels (status contract). Kept in sync with
// src/common/status/jobStatus.ts (PascalCase variant). Vietnamese is reserved for helper copy.
export const jobStatusLabels: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  "Full-time": "Toàn thời gian",
  "Part-time": "Bán thời gian",
  Internship: "Thực tập",
  Contract: "Hợp đồng",
};

export const workModeLabels: Record<WorkMode, string> = {
  Onsite: "Tại văn phòng",
  Hybrid: "Linh hoạt",
  Remote: "Từ xa",
};
