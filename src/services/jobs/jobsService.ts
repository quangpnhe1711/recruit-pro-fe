import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";
import type {
  ApplicationListItemDto,
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

function normalizeJobListItem(item: Partial<JobListItemDto> & { department?: unknown; postedAt?: string | null }) {
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
    createdAt: item.createdAt ?? item.postedAt ?? new Date().toISOString(),
    availableActions: item.availableActions ?? [],
    applicationCount: item.applicationCount ?? 0,
    createdBy: item.createdBy ?? { id: "", fullName: "", email: "", avatarUrl: null, phone: null, roles: [] },
    approvedBy: item.approvedBy ?? null,
    vacancyCount: item.vacancyCount ?? 0,
    deadline: item.deadline ?? null,
    status: item.status ?? "APPROVED",
  } as JobListItemDto;
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
    return request.get<ApiResponse<JobDetailDto>>(endpoints.jobs.detail(jobId));
  },

  getJobApplications: async (
    jobId: string,
  ): Promise<ApiResponse<PaginatedResponse<ApplicationListItemDto>>> => {
    return request.get<ApiResponse<PaginatedResponse<ApplicationListItemDto>>>(
      endpoints.jobs.applications(jobId),
    );
  },

  getJobFunnel: async (jobId: string): Promise<ApiResponse<JobFunnelStageDto[]>> => {
    const response = await request.get<ApiResponse<JobStatisticsDto>>(endpoints.jobs.statistics(jobId));
    return {
      ...response,
      data: response.data?.hiringFunnel ?? [],
    };
  },

  getJobStatistics: async (jobId: string): Promise<ApiResponse<JobStatisticsDto>> => {
    return request.get<ApiResponse<JobStatisticsDto>>(endpoints.jobs.statistics(jobId));
  },

  getRecentJobApplications: async (
    jobId: string,
  ): Promise<ApiResponse<ApplicationListItemDto[]>> => {
    return request.get<ApiResponse<ApplicationListItemDto[]>>(endpoints.jobs.recentApplications(jobId));
  },

  applyToJob: async (
    jobId: string,
    data?: { coverLetter?: string | null },
  ): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>, { coverLetter?: string | null }>(
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
