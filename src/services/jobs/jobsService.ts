import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";
import type {
  ApplicationListItemDto,
  ApplyJobRequestDto,
  ApplyJobResponseDto,
  ApplyJobScreenDto,
  CreateJobRequest,
  DepartmentDto,
  HrJobQueryParams,
  JobDetailDto,
  JobSearchFiltersDto,
  JobFunnelStageDto,
  JobListItemDto,
  JobStatisticsDto,
  ManagerJobApprovalDetailDto,
  ManagerJobApprovalQueryParams,
  ManagerJobApprovalQueueResponseDto,
  PaginatedResponse,
  PublicJobQueryParams,
  SkillDto,
  UpdateJobRequest,
  UpdateJobStatusRequest,
} from "../../modules/jobs/jobsSchema";

function buildParams<T extends Record<string, unknown>>(params?: T) {
  if (!params) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

  return Object.keys(cleaned).length ? cleaned : undefined;
}

function serializeParams(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, String(item));
        }
      });
      return;
    }

    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
}

function toPaginatedResponse<T>(
  payload: { items?: T[]; meta?: ApiResponse<unknown>["meta"] } | null | undefined,
): PaginatedResponse<T> {
  const items = payload?.items ?? [];
  const meta = payload?.meta;

  return {
    items,
    page: meta?.page ?? 1,
    pageSize: meta?.pageSize ?? items.length,
    totalItems: meta?.totalItems ?? items.length,
    totalPages: meta?.totalPages ?? 1,
  };
}

function normalizeJobStatus(value?: string | null): JobListItemDto["status"] {
  switch (value?.trim().toUpperCase()) {
    case "DRAFT":
      return "DRAFT";
    case "PENDING_APPROVAL":
    case "PENDINGAPPROVAL":
    case "PENDING":
      return "PENDING_APPROVAL";
    case "REJECTED":
      return "REJECTED";
    case "APPROVED":
      return "APPROVED";
    case "CLOSED":
      return "CLOSED";
    default:
      return "PENDING_APPROVAL";
  }
}

function normalizeJobListItem(
  item: Partial<JobListItemDto> & {
    department?: unknown;
    postedAt?: string | null;
    approvalStatus?: string | null;
  },
) {
  const departmentName =
    typeof item.department === "string"
      ? item.department
      : typeof item.department === "object" && item.department && "name" in item.department
        ? String((item.department as { name?: unknown }).name ?? "")
        : "";

  return {
    ...item,
    department: {
      id: departmentName,
      name: departmentName,
      description: null,
    },
    minExperienceYears: item.minExperienceYears ?? 0,
    createdAt:
      item.createdAt ??
      (item as { createdDate?: string | null }).createdDate ??
      item.postedAt ??
      new Date().toISOString(),
    availableActions: item.availableActions ?? [],
    applicationCount:
      item.applicationCount ??
      (item as { applicationsCount?: number }).applicationsCount ??
      0,
    createdBy:
      item.createdBy ??
      ((item as { createdBy?: { id?: string; fullName?: string; email?: string } }).createdBy
        ? {
            id: (item as { createdBy: { id?: string } }).createdBy.id ?? "",
            fullName: (item as { createdBy: { fullName?: string } }).createdBy.fullName ?? "",
            email: (item as { createdBy: { email?: string } }).createdBy.email ?? "",
            avatarUrl: null,
            phone: null,
            roles: [],
          }
        : { id: "", fullName: "", email: "", avatarUrl: null, phone: null, roles: [] }),
    approvedBy: item.approvedBy ?? null,
    vacancyCount: item.vacancyCount ?? 0,
    deadline: item.deadline ?? null,
    // Ownership snapshot (Phase 2/3) — pass through when present, else null. Display-only.
    recruiterId: item.recruiterId ?? null,
    recruiterName: item.recruiterName ?? null,
    departmentHeadId: item.departmentHeadId ?? null,
    departmentHeadName: item.departmentHeadName ?? null,
    effectiveDepartmentHeadId: item.effectiveDepartmentHeadId ?? null,
    effectiveDepartmentHeadName: item.effectiveDepartmentHeadName ?? null,
    status: normalizeJobStatus(item.status ?? item.approvalStatus),
  } as JobListItemDto;
}

type RawPublicJobDetail = {
  id?: string;
  title?: string;
  location?: string;
  postedAt?: string | null;
  status?: string;
  salaryRange?: {
    min?: number | null;
    max?: number | null;
    label?: string | null;
  } | null;
  salaryLabel?: string | null;
  department?: string;
  jobType?: string;
  vacancyCount?: number | null;
  description?: string[] | string | null;
  requirements?: string[] | null;
  requiredSkills?: Array<{
    id?: string;
    name?: string;
    minYearsExperience?: number | null;
    minimumYearsOfExperience?: number | null;
    isRequired?: boolean;
    skillType?: string;
  }> | null;
  niceToHaveSkills?: Array<{
    id?: string;
    name?: string;
    minYearsExperience?: number | null;
    minimumYearsOfExperience?: number | null;
    isRequired?: boolean;
    skillType?: string;
  }> | null;
  skills?: Array<{
    id?: string;
    name?: string;
    minYearsExperience?: number | null;
    minimumYearsOfExperience?: number | null;
    isRequired?: boolean;
    skillType?: string;
  }> | null;
  applicationSummary?: {
    totalApplications?: number;
    funnel?: Array<{
      label?: string;
      count?: number;
      color?: string | null;
    }> | null;
  } | null;
};

type RawHrJobDetail = {
  id?: string;
  title?: string;
  department?: string;
  location?: string;
  workMode?: string;
  requirements?: string[] | null;
  requiredSkills?: Array<{
    id?: string;
    name?: string;
    minYearsExperience?: number | null;
    minimumYearsOfExperience?: number | null;
    isRequired?: boolean;
    skillType?: string;
  }> | null;
  niceToHaveSkills?: Array<{
    id?: string;
    name?: string;
    minYearsExperience?: number | null;
    minimumYearsOfExperience?: number | null;
    isRequired?: boolean;
    skillType?: string;
  }> | null;
  skills?: Array<{
    id?: string;
    name?: string;
    minYearsExperience?: number | null;
    minimumYearsOfExperience?: number | null;
    isRequired?: boolean;
    skillType?: string;
  }> | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  deadline?: string | null;
  jobType?: string;
  posted?: string | null;
  vacancyCount?: number | null;
  status?: string;
  description?: string[] | string | null;
  // Ownership snapshot (Phase 2/3) — present on GET /api/hr/jobs/{id}.
  recruiterId?: string | null;
  recruiterName?: string | null;
  recruiterEmail?: string | null;
  departmentHeadId?: string | null;
  departmentHeadName?: string | null;
  departmentHeadEmail?: string | null;
  effectiveDepartmentHeadId?: string | null;
  effectiveDepartmentHeadName?: string | null;
  effectiveDepartmentHeadEmail?: string | null;
  createdBy?: string | null;
  createdByName?: string | null;
  approvedBy?: string | null;
  approvedByName?: string | null;
};

function normalizeEmploymentType(value?: string | null): JobDetailDto["employmentType"] {
  switch (value?.trim().toLowerCase()) {
    case "part-time":
    case "part time":
    case "parttime":
      return "Part-time";
    case "internship":
      return "Internship";
    case "contract":
      return "Contract";
    default:
      return "Full-time";
  }
}

function normalizeWorkMode(value?: string | null): JobDetailDto["workMode"] {
  switch (value?.trim().toLowerCase()) {
    case "onsite":
    case "on-site":
      return "Onsite";
    case "hybrid":
      return "Hybrid";
    default:
      return "Remote";
  }
}

function normalizeJobDetailStatus(value?: string | null): JobDetailDto["status"] {
  switch (value?.trim().toUpperCase()) {
    case "DRAFT":
      return "DRAFT";
    case "PENDING_APPROVAL":
    case "PENDING":
      return "PENDING_APPROVAL";
    case "CLOSED":
      return "CLOSED";
    case "REJECTED":
      return "REJECTED";
    default:
      return "APPROVED";
  }
}

function toDescriptionText(value?: string[] | string | null) {
  if (Array.isArray(value)) {
    return value.filter(Boolean).join("\n\n");
  }

  return value ?? "";
}

function mapJobSkill(
  skill: {
    id?: string;
    name?: string;
    minYearsExperience?: number | null;
    minimumYearsOfExperience?: number | null;
    isRequired?: boolean;
    skillType?: string;
  },
) {
  return {
    skill: {
      id: skill.id ?? "",
      name: skill.name ?? "",
    },
    minYearsExperience:
      skill.minimumYearsOfExperience ?? skill.minYearsExperience ?? null,
    isRequired:
      skill.isRequired ??
      (skill.skillType?.toLowerCase() === "required"),
    skillType:
      skill.skillType ?? (skill.isRequired ? "Required" : "NiceToHave"),
    minimumYearsOfExperience:
      skill.minimumYearsOfExperience ?? skill.minYearsExperience ?? null,
  };
}

function normalizePublicJobDetail(item: RawPublicJobDetail | null | undefined): JobDetailDto {
  const employmentTypeLabel = item?.jobType?.split(",")[0]?.trim();
  const workModeLabel = item?.location?.match(/\(([^)]+)\)\s*$/)?.[1] ?? item?.jobType?.split(",")[1]?.trim();
  const cleanLocation = item?.location?.replace(/\s*\([^)]+\)\s*$/, "") ?? "";

  return {
    id: item?.id ?? "",
    title: item?.title ?? "",
    department: {
      id: item?.department ?? "",
      name: item?.department ?? "",
      description: null,
    },
    location: cleanLocation,
    workMode: normalizeWorkMode(workModeLabel),
    employmentType: normalizeEmploymentType(employmentTypeLabel),
    minExperienceYears: 0,
    vacancyCount: item?.vacancyCount ?? 0,
    salaryMin: item?.salaryRange?.min ?? null,
    salaryMax: item?.salaryRange?.max ?? null,
    salaryLabel: item?.salaryLabel ?? item?.salaryRange?.label ?? "",
    deadline: null,
    status: normalizeJobDetailStatus(item?.status),
    createdAt: item?.postedAt ?? new Date().toISOString(),
    description: toDescriptionText(item?.description),
    requirements: item?.requirements ?? [],
    benefits: [],
    requiredSkills: (item?.requiredSkills ?? []).map(mapJobSkill),
    niceToHaveSkills: (item?.niceToHaveSkills ?? []).map(mapJobSkill),
    skills: (item?.skills ?? []).map(mapJobSkill),
    summary: "",
    hiringManager: null,
    applicationCount: item?.applicationSummary?.totalApplications ?? 0,
    recentApplications: [],
    hiringFunnel: (item?.applicationSummary?.funnel ?? []).map((stage) => ({
      label: stage.label ?? "",
      count: stage.count ?? 0,
      color: stage.color ?? "#b90014",
    })),
    availableActions: [],
  };
}

function normalizeHrJobDetail(item: RawHrJobDetail | null | undefined): JobDetailDto {
  const employmentTypeLabel = item?.jobType?.split("/")[0]?.trim();

  return {
    id: item?.id ?? "",
    title: item?.title ?? "",
    department: {
      id: item?.department ?? "",
      name: item?.department ?? "",
      description: null,
    },
    location: item?.location ?? "",
    workMode: normalizeWorkMode(item?.workMode),
    employmentType: normalizeEmploymentType(employmentTypeLabel),
    minExperienceYears: 0,
    vacancyCount: item?.vacancyCount ?? 0,
    salaryMin: item?.salaryMin ?? null,
    salaryMax: item?.salaryMax ?? null,
    salaryLabel: "",
    deadline: item?.deadline ?? null,
    status: normalizeJobDetailStatus(item?.status),
    createdAt: item?.posted ? new Date(item.posted).toISOString() : new Date().toISOString(),
    description: toDescriptionText(item?.description),
    requirements: item?.requirements ?? [],
    benefits: [],
    requiredSkills: (item?.requiredSkills ?? []).map(mapJobSkill),
    niceToHaveSkills: (item?.niceToHaveSkills ?? []).map(mapJobSkill),
    skills: (item?.skills ?? []).map(mapJobSkill),
    summary: "",
    hiringManager: null,
    applicationCount: 0,
    recentApplications: [],
    hiringFunnel: [],
    availableActions: [],
    ownership: {
      recruiterId: item?.recruiterId ?? null,
      recruiterName: item?.recruiterName ?? null,
      recruiterEmail: item?.recruiterEmail ?? null,
      departmentHeadId: item?.departmentHeadId ?? null,
      departmentHeadName: item?.departmentHeadName ?? null,
      departmentHeadEmail: item?.departmentHeadEmail ?? null,
      effectiveDepartmentHeadId: item?.effectiveDepartmentHeadId ?? null,
      effectiveDepartmentHeadName: item?.effectiveDepartmentHeadName ?? null,
      effectiveDepartmentHeadEmail: item?.effectiveDepartmentHeadEmail ?? null,
      createdById: item?.createdBy ?? null,
      createdByName: item?.createdByName ?? null,
      approvedById: item?.approvedBy ?? null,
      approvedByName: item?.approvedByName ?? null,
    },
  };
}

export const jobsService = {
  listPublicJobs: async (
    params?: PublicJobQueryParams,
  ): Promise<ApiResponse<PaginatedResponse<JobListItemDto>>> => {
    const requestParams = buildParams({
      Page: params?.page,
      PageSize: params?.pageSize,
      Keyword: params?.keyword,
      EmploymentTypes: params?.employmentTypes,
      Skills: params?.skills,
      SortBy: params?.sortBy,
    });

    const response = await request.get<
      ApiResponse<{
        items?: JobListItemDto[];
        meta?: ApiResponse<unknown>["meta"];
      }>
    >(
      endpoints.jobs.list,
      requestParams
        ? {
            params: requestParams,
            paramsSerializer: serializeParams,
          }
        : undefined,
    );

    return {
      ...response,
      data: {
        ...toPaginatedResponse(response.data),
        items: toPaginatedResponse(response.data).items.map(normalizeJobListItem),
      },
      meta: response.data?.meta ?? response.meta,
    };
  },

  getPublicJobFilters: async (): Promise<ApiResponse<JobSearchFiltersDto>> => {
    const response = await request.get<
      ApiResponse<{
        employmentTypes?: string[];
        skills?: string[];
      }>
    >(endpoints.jobs.filters);

    return {
      ...response,
      data: {
        employmentTypes: (response.data?.employmentTypes ?? []).map((value) => ({
          label: value,
          value,
        })),
        skills: (response.data?.skills ?? []).map((value) => ({
          label: value,
          value,
        })),
      },
    };
  },

  getJobDetail: async (jobId: string): Promise<ApiResponse<JobDetailDto>> => {
    const response = await request.get<ApiResponse<RawPublicJobDetail>>(endpoints.jobs.detail(jobId));

    return {
      ...response,
      data: normalizePublicJobDetail(response.data),
    };
  },

  getHrJobDetail: async (jobId: string): Promise<ApiResponse<JobDetailDto>> => {
    const response = await request.get<ApiResponse<RawHrJobDetail>>(endpoints.hrJobs.detail(jobId));

    return {
      ...response,
      data: normalizeHrJobDetail(response.data),
    };
  },

  getApplyContext: async (jobId: string): Promise<ApiResponse<ApplyJobScreenDto>> => {
    return request.get<ApiResponse<ApplyJobScreenDto>>(endpoints.jobs.applyContext(jobId));
  },

  getJobApplications: async (
    jobId: string,
  ): Promise<ApiResponse<PaginatedResponse<ApplicationListItemDto>>> => {
    return request.get<ApiResponse<PaginatedResponse<ApplicationListItemDto>>>(
      endpoints.jobs.applications(jobId),
    );
  },

  getJobFunnel: async (jobId: string): Promise<ApiResponse<JobFunnelStageDto[]>> => {
    const response = await request.get<ApiResponse<{
      applied?: number;
      screening?: number;
      interview?: number;
      offer?: number;
      hired?: number;
    }>>(endpoints.jobs.statistics(jobId));
    return {
      ...response,
      data: [
        { label: "Applied", count: response.data?.applied ?? 0, color: "#b90014" },
        { label: "Screening", count: response.data?.screening ?? 0, color: "#d97706" },
        { label: "Interview", count: response.data?.interview ?? 0, color: "#005f93" },
        { label: "Offer", count: response.data?.offer ?? 0, color: "#6d28d9" },
        { label: "Hired", count: response.data?.hired ?? 0, color: "#15803d" },
      ],
    };
  },

  getJobStatistics: async (jobId: string): Promise<ApiResponse<JobStatisticsDto>> => {
    const response = await request.get<ApiResponse<{
      applied?: number;
      screening?: number;
      interview?: number;
      offer?: number;
      hired?: number;
    }>>(endpoints.jobs.statistics(jobId));

    return {
      ...response,
      data: {
        hiringFunnel: [
          { label: "Applied", count: response.data?.applied ?? 0, color: "#b90014" },
          { label: "Screening", count: response.data?.screening ?? 0, color: "#d97706" },
          { label: "Interview", count: response.data?.interview ?? 0, color: "#005f93" },
          { label: "Offer", count: response.data?.offer ?? 0, color: "#6d28d9" },
          { label: "Hired", count: response.data?.hired ?? 0, color: "#15803d" },
        ],
      },
    };
  },

  getRecentJobApplications: async (
    jobId: string,
  ): Promise<ApiResponse<ApplicationListItemDto[]>> => {
    const response = await request.get<ApiResponse<Array<{
      id: string;
      candidateId: string;
      candidateName: string;
      avatarUrl?: string | null;
      appliedAt?: string | null;
      status: string;
      score?: number | null;
    }>>>(endpoints.jobs.recentApplications(jobId));

    return {
      ...response,
      data: (response.data ?? []).map((item) => ({
        id: item.id,
        candidate: {
          id: item.candidateId,
          fullName: item.candidateName,
          email: "",
          avatarUrl: item.avatarUrl ?? null,
          currentPosition: null,
        },
        job: {
          id: jobId,
          title: "",
          department: {
            id: "",
            name: "",
            description: null,
          },
        },
        status: item.status as ApplicationListItemDto["status"],
        appliedAt: item.appliedAt ?? new Date().toISOString(),
        reviewedBy: null,
        nextStep: item.score != null ? String(item.score) : null,
      })),
    };
  },

  applyToJob: async (
    jobId: string,
    data?: ApplyJobRequestDto,
  ): Promise<ApiResponse<ApplyJobResponseDto>> => {
    return request.post<ApiResponse<ApplyJobResponseDto>, ApplyJobRequestDto>(
      endpoints.jobs.apply(jobId),
      data,
    );
  },

  listDepartments: async (): Promise<ApiResponse<DepartmentDto[]>> => {
    return request.get<ApiResponse<DepartmentDto[]>>(endpoints.departments);
  },

  listSkills: async (): Promise<ApiResponse<SkillDto[]>> => {
    const response = await request.get<ApiResponse<SkillDto[]>>(endpoints.skills);

    return {
      ...response,
      data: response.data ?? [],
    };
  },

  listHrJobs: async (
    params?: HrJobQueryParams,
  ): Promise<ApiResponse<PaginatedResponse<JobListItemDto> & {
    stats?: {
      activeJobs: number;
      pendingApproval: number;
      totalApplications: number;
      timeToHireDays: number;
    };
  }>> => {
    const response = await request.get<
      ApiResponse<{
        items?: JobListItemDto[];
        meta?: ApiResponse<unknown>["meta"];
        stats?: {
          activeJobs: number;
          pendingApproval: number;
          totalApplications: number;
          timeToHireDays: number;
        };
      }>
    >(
      endpoints.hrJobs.list,
      { params: buildParams(params) },
    );

    return {
      ...response,
      data: {
        ...toPaginatedResponse(response.data),
        items: toPaginatedResponse(response.data).items.map(normalizeJobListItem),
        stats: response.data?.stats,
      },
      meta: response.data?.meta ?? response.meta,
    };
  },

  createJob: async (data: CreateJobRequest): Promise<ApiResponse<{ jobId: string; approvalStatus: string }>> => {
    return request.post<ApiResponse<{ jobId: string; approvalStatus: string }>, CreateJobRequest>(
      endpoints.hrJobs.list,
      data,
    );
  },

  updateJob: async (
    jobId: string,
    data: UpdateJobRequest,
  ): Promise<ApiResponse<{ jobId: string; approvalStatus: string }>> => {
    return request.patch<ApiResponse<{ jobId: string; approvalStatus: string }>, UpdateJobRequest>(
      endpoints.hrJobs.detail(jobId),
      data,
    );
  },

  updateJobStatus: async (
    jobId: string,
    data: UpdateJobStatusRequest,
  ): Promise<ApiResponse<{ jobId: string; approvalStatus: string }>> => {
    return request.patch<ApiResponse<{ jobId: string; approvalStatus: string }>, UpdateJobStatusRequest>(
      endpoints.hrJobs.status(jobId),
      data,
    );
  },

  deleteJob: async (jobId: string): Promise<ApiResponse<null>> => {
    return request.delete<ApiResponse<null>>(endpoints.hrJobs.detail(jobId));
  },

  getManagerApprovalQueue: async (
    params?: ManagerJobApprovalQueryParams,
  ): Promise<ApiResponse<ManagerJobApprovalQueueResponseDto>> => {
    return request.get<ApiResponse<ManagerJobApprovalQueueResponseDto>>(
      endpoints.manager.jobApprovalQueue,
      { params: buildParams(params) },
    );
  },

  getManagerApprovalDetail: async (
    jobId: string,
  ): Promise<ApiResponse<ManagerJobApprovalDetailDto>> => {
    return request.get<ApiResponse<ManagerJobApprovalDetailDto>>(
      endpoints.manager.jobApprovalDetail(jobId),
    );
  },
};
