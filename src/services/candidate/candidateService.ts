import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export type CandidateDashboardDto = {
  greetingName: string;
  stats: {
    appliedJobs: number;
    interviews: number;
    unreadNotifications: number;
  };
  upcomingInterview: {
    id: string;
    date: string;
    time: string;
    jobTitle: string;
    interviewerName: string;
    interviewerTitle: string;
    meetingUrl: string;
  } | null;
  recommendedJobs: Array<{
    id: string;
    title: string;
    meta: string;
    employmentType: string;
    skills: string[];
    layout?: "compact";
    actionLabel?: string;
  }>;
};

export type CandidateApplicationItemDto = {
  id: string;
  jobId: string;
  jobTitle: string;
  companyOrDepartment: string;
  appliedDate: string;
  status: string;
  nextStep: string;
  availableActions: string[];
};

export type CandidateApplicationsResponseDto = {
  data: CandidateApplicationItemDto[];
  meta?: ApiResponse<unknown>["meta"];
  extra?: {
    summary?: {
      total: number;
      active: number;
      closed: number;
    };
  };
};

export type CandidateProfileResponseDto = {
  profile: {
    id: string;
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    memberSince: string;
    bio: string;
    github: string;
    linkedin: string;
  };
  skills: Array<{
    id: string;
    label: string;
    active: boolean;
  }>;
  experienceEntries: Array<{
    id: string;
    title: string;
    company: string;
    period: {
      startMonth: number;
      startYear: number;
      endMonth: number | null;
      endYear: number | null;
      isCurrent: boolean;
    };
    bullets: string[];
  }>;
  resume: {
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
  } | null;
};

export type CandidateProfileUpdateRequest = {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  github: string;
  linkedin: string;
};

export type CandidateExperienceRequest = {
  title: string;
  company: string;
  period: {
    startMonth: number;
    startYear: number;
    endMonth: number | null;
    endYear: number | null;
    isCurrent: boolean;
  };
  bullets: string[];
};

function buildParams<T extends Record<string, unknown>>(params?: T) {
  if (!params) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

  return Object.keys(cleaned).length ? cleaned : undefined;
}

export const candidateService = {
  getDashboard: async (): Promise<ApiResponse<CandidateDashboardDto>> => {
    return request.get<ApiResponse<CandidateDashboardDto>>(endpoints.candidate.dashboard);
  },

  getApplications: async (
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<CandidateApplicationItemDto[]>> => {
    return request.get<ApiResponse<CandidateApplicationItemDto[]>>(
      endpoints.candidate.applications,
      { params: buildParams(params) },
    );
  },

  withdrawApplication: async (applicationId: string): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>>(endpoints.candidate.applicationWithdraw(applicationId));
  },

  acceptOffer: async (applicationId: string): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>>(endpoints.candidate.applicationAcceptOffer(applicationId));
  },

  getProfile: async (): Promise<ApiResponse<CandidateProfileResponseDto>> => {
    return request.get<ApiResponse<CandidateProfileResponseDto>>(endpoints.candidate.profile);
  },

  updateProfile: async (
    data: CandidateProfileUpdateRequest,
  ): Promise<ApiResponse<CandidateProfileResponseDto["profile"]>> => {
    return request.put<ApiResponse<CandidateProfileResponseDto["profile"]>, CandidateProfileUpdateRequest>(
      endpoints.candidate.profile,
      data,
    );
  },

  updateSkills: async (skillIds: string[]): Promise<ApiResponse<null>> => {
    return request.put<ApiResponse<null>, { skillIds: string[] }>(
      endpoints.candidate.profileSkills,
      { skillIds },
    );
  },

  createExperience: async (
    data: CandidateExperienceRequest,
  ): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>, CandidateExperienceRequest>(
      endpoints.candidate.profileExperience,
      data,
    );
  },

  updateExperience: async (
    experienceId: string,
    data: CandidateExperienceRequest,
  ): Promise<ApiResponse<null>> => {
    return request.put<ApiResponse<null>, CandidateExperienceRequest>(
      endpoints.candidate.profileExperienceDetail(experienceId),
      data,
    );
  },

  deleteExperience: async (experienceId: string): Promise<ApiResponse<null>> => {
    return request.delete<ApiResponse<null>>(
      endpoints.candidate.profileExperienceDetail(experienceId),
    );
  },

  uploadResume: async (file: File): Promise<ApiResponse<{ resumeId: string; fileName: string; uploadedAt: string }>> => {
    const formData = new FormData();
    formData.append("resume", file);

    return request.post<ApiResponse<{ resumeId: string; fileName: string; uploadedAt: string }>, FormData>(
      endpoints.candidate.profileResume,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },
};
