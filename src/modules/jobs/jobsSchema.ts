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

export type ApplicationReviewDecision = "hire" | "hold" | "reject";

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
  salaryMin: number | null;
  salaryMax: number | null;
  currency?: string | null;
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

export const jobStatusLabels: Record<JobStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED: "Approved",
  CLOSED: "Closed",
  REJECTED: "Rejected",
};

export const employmentTypeLabels: Record<EmploymentType, string> = {
  "Full-time": "Full-time",
  "Part-time": "Part-time",
  Internship: "Internship",
  Contract: "Contract",
};

export const workModeLabels: Record<WorkMode, string> = {
  Onsite: "On-site",
  Hybrid: "Hybrid",
  Remote: "Remote",
};
