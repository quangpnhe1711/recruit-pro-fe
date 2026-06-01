import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";
import type {
  ApplicationListItemDto,
  CreateJobRequest,
  DepartmentDto,
  HrJobQueryParams,
  JobDetailDto,
  JobFunnelStageDto,
  JobListItemDto,
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

export const jobsService = {
  listPublicJobs: async (
    params?: PublicJobQueryParams,
  ): Promise<ApiResponse<PaginatedResponse<JobListItemDto>>> => {
    return request.get<ApiResponse<PaginatedResponse<JobListItemDto>>>(
      endpoints.jobs.list,
      { params: buildParams(params) },
    );
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
    return request.get<ApiResponse<JobFunnelStageDto[]>>(endpoints.jobs.funnel(jobId));
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
