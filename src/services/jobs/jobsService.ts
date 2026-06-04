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

    return request.get<ApiResponse<PaginatedResponse<JobListItemDto>>>(
      endpoints.jobs.list,
      requestParams
        ? {
            params: requestParams,
            paramsSerializer: serializeParams,
          }
        : undefined,
    );
  },

  getPublicJobFilters: async (): Promise<ApiResponse<JobSearchFiltersDto>> => {
    return request.get<ApiResponse<JobSearchFiltersDto>>(endpoints.jobs.filters);
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
    return request.get<ApiResponse<JobFunnelStageDto[]>>(endpoints.jobs.statistics(jobId));
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
    return request.get<ApiResponse<SkillDto[]>>(endpoints.skills);
  },

  listHrJobs: async (
    params?: HrJobQueryParams,
  ): Promise<ApiResponse<PaginatedResponse<JobListItemDto>>> => {
    return request.get<ApiResponse<PaginatedResponse<JobListItemDto>>>(
      endpoints.hrJobs.list,
      { params: buildParams(params) },
    );
  },

  createJob: async (data: CreateJobRequest): Promise<ApiResponse<JobDetailDto>> => {
    return request.post<ApiResponse<JobDetailDto>, CreateJobRequest>(
      endpoints.hrJobs.list,
      data,
    );
  },

  updateJob: async (
    jobId: string,
    data: UpdateJobRequest,
  ): Promise<ApiResponse<JobDetailDto>> => {
    return request.patch<ApiResponse<JobDetailDto>, UpdateJobRequest>(
      endpoints.hrJobs.detail(jobId),
      data,
    );
  },

  updateJobStatus: async (
    jobId: string,
    data: UpdateJobStatusRequest,
  ): Promise<ApiResponse<JobDetailDto>> => {
    return request.patch<ApiResponse<JobDetailDto>, UpdateJobStatusRequest>(
      endpoints.hrJobs.status(jobId),
      data,
    );
  },

  deleteJob: async (jobId: string): Promise<ApiResponse<null>> => {
    return request.delete<ApiResponse<null>>(endpoints.hrJobs.detail(jobId));
  },
};
