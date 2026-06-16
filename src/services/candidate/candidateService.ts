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

export type CandidateInterviewItemDto = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewer: string;
  dateLabel: string;
  timeLabel: string;
  startAt: string;
  endAt: string;
  status: string;
};

export type CandidateApplicationsResponseDto = {
  items: CandidateApplicationItemDto[];
  meta?: ApiResponse<unknown>["meta"];
  summary?: {
    total: number;
    active: number;
    closed: number;
  };
};

export type CandidateProfileResponseDto = {
  profile: {
    id: string;
    name: string;
    avatarUrl: string | null;
    headline: string;
    email: string;
    phone: string;
    location: string;
    memberSince: string;
    bio: string;
    github: string;
    linkedin: string;
    completionScore: number;
  };
  skills: Array<{
    id: string;
    label: string;
    active: boolean;
    yearsOfExperience: number | null;
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
  projects: Array<{
    id: string;
    name: string;
    role: string | null;
    description: string | null;
    technologies: string[];
    period: {
      startMonth: number;
      startYear: number;
      endMonth: number | null;
      endYear: number | null;
      isCurrent: boolean;
    };
  }>;
  educations: Array<{
    id: string;
    school: string;
    degree: string;
    fieldOfStudy: string | null;
    startYear: number | null;
    endYear: number | null;
    description: string | null;
  }>;
  certifications: Array<{
    id: string;
    name: string;
    issuer: string | null;
    issuedOn: string | null;
    expiresOn: string | null;
    credentialId: string | null;
    credentialUrl: string | null;
  }>;
  languages: Array<{
    id: string;
    name: string;
    proficiency: string;
  }>;
  resume: {
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    version: number;
    isCurrent: boolean;
  } | null;
  resumeHistory: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string;
    version: number;
    isCurrent: boolean;
  }>;
};

export type CandidateResumeParseResponseDto = {
  usedAi: boolean;
  parsingMode: string;
  modelName?: string | null;
  aiFallbackReason?: string | null;
  profile: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    bio: string;
    github: string;
    linkedin: string;
  };
  skills: Array<{
    id: string;
    label: string;
    active: boolean;
    yearsOfExperience: number | null;
  }>;
  experienceEntries: CandidateProfileResponseDto["experienceEntries"];
  projects: CandidateProfileResponseDto["projects"];
  educations: CandidateProfileResponseDto["educations"];
  certifications: CandidateProfileResponseDto["certifications"];
  languages: CandidateProfileResponseDto["languages"];
  notes: string[];
  extractedTextPreview: string;
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
  skills?: Array<{
    skillId: string;
    yearsOfExperience: number | null;
  }>;
  experienceEntries?: CandidateExperienceRequest[];
  projects?: Array<{
    id?: string;
    name: string;
    role?: string | null;
    description?: string | null;
    technologies: string[];
    period: CandidateExperienceRequest["period"];
  }>;
  educations?: Array<{
    id?: string;
    school: string;
    degree: string;
    fieldOfStudy?: string | null;
    startYear?: number | null;
    endYear?: number | null;
    description?: string | null;
  }>;
  certifications?: Array<{
    id?: string;
    name: string;
    issuer?: string | null;
    issuedOn?: string | null;
    expiresOn?: string | null;
    credentialId?: string | null;
    credentialUrl?: string | null;
  }>;
  languages?: Array<{
    id?: string;
    name: string;
    proficiency: string;
  }>;
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

export type CandidateRegisterPayload = {
  userInfo: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
  };
  profile?: {
    currentPosition?: string;
    experienceYears?: number | null;
    education?: string;
    address?: string;
    bio?: string;
    githubUrl?: string;
    linkedInUrl?: string;
  } | null;
  resume?: File | null;
};

function buildParams<T extends Record<string, unknown>>(params?: T) {
  if (!params) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

  return Object.keys(cleaned).length ? cleaned : undefined;
}

export const candidateService = {
  register: async (
    payload: CandidateRegisterPayload,
  ): Promise<ApiResponse<{ userId: string; candidateId: string; resumeUploaded: boolean }>> => {
    const formData = new FormData();

    formData.append("UserInfo.FullName", payload.userInfo.fullName);
    formData.append("UserInfo.Email", payload.userInfo.email);
    formData.append("UserInfo.PasswordHash", payload.userInfo.password);
    formData.append("UserInfo.Phone", payload.userInfo.phone);

    if (payload.profile) {
      if (payload.profile.currentPosition) {
        formData.append("Profile.CurrentPosition", payload.profile.currentPosition);
      }
      if (payload.profile.experienceYears != null) {
        formData.append("Profile.ExperienceYears", String(payload.profile.experienceYears));
      }
      if (payload.profile.education) {
        formData.append("Profile.Education", payload.profile.education);
      }
      if (payload.profile.address) {
        formData.append("Profile.Address", payload.profile.address);
      }
      if (payload.profile.bio) {
        formData.append("Profile.Bio", payload.profile.bio);
      }
      if (payload.profile.githubUrl) {
        formData.append("Profile.GitHubUrl", payload.profile.githubUrl);
      }
      if (payload.profile.linkedInUrl) {
        formData.append("Profile.LinkedInUrl", payload.profile.linkedInUrl);
      }
    }

    if (payload.resume) {
      formData.append("resume", payload.resume);
    }

    return request.post<
      ApiResponse<{ userId: string; candidateId: string; resumeUploaded: boolean }>,
      FormData
    >(endpoints.candidates.register, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },

  getDashboard: async (): Promise<ApiResponse<CandidateDashboardDto>> => {
    return request.get<ApiResponse<CandidateDashboardDto>>(endpoints.candidate.dashboard);
  },

  getApplications: async (
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<CandidateApplicationsResponseDto>> => {
    return request.get<ApiResponse<CandidateApplicationsResponseDto>>(
      endpoints.candidate.applications,
      { params: buildParams(params) },
    );
  },

  getInterviews: async (): Promise<ApiResponse<CandidateInterviewItemDto[]>> => {
    const response = await request.get<ApiResponse<{ items?: CandidateInterviewItemDto[] }>>(
      endpoints.candidate.interviews,
    );

    return {
      ...response,
      data: response.data?.items ?? [],
    };
  },

  withdrawApplication: async (applicationId: string): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>>(endpoints.candidate.applicationWithdraw(applicationId));
  },

  acceptOffer: async (applicationId: string): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>>(endpoints.candidate.applicationAcceptOffer(applicationId));
  },

  declineOffer: async (applicationId: string): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>>(endpoints.candidate.applicationDeclineOffer(applicationId));
  },

  getProfile: async (): Promise<ApiResponse<CandidateProfileResponseDto>> => {
    return request.get<ApiResponse<CandidateProfileResponseDto>>(endpoints.candidate.profile);
  },

  updateProfile: async (
    data: CandidateProfileUpdateRequest,
  ): Promise<ApiResponse<CandidateProfileResponseDto>> => {
    return request.put<ApiResponse<CandidateProfileResponseDto>, CandidateProfileUpdateRequest>(
      endpoints.candidate.profile,
      data,
    );
  },

  updateSkills: async (
    skills: Array<{ skillId: string; yearsOfExperience?: number | null }> | string[],
  ): Promise<ApiResponse<CandidateProfileResponseDto>> => {
    const payload = Array.isArray(skills) && typeof skills[0] === "string"
      ? { skillIds: skills as string[] }
      : { skills: skills as Array<{ skillId: string; yearsOfExperience?: number | null }> };

    return request.put<ApiResponse<CandidateProfileResponseDto>, typeof payload>(
      endpoints.candidate.profileSkills,
      payload,
    );
  },

  createExperience: async (
    data: CandidateExperienceRequest,
  ): Promise<ApiResponse<CandidateProfileResponseDto>> => {
    return request.post<ApiResponse<CandidateProfileResponseDto>, CandidateExperienceRequest>(
      endpoints.candidate.profileExperience,
      data,
    );
  },

  updateExperience: async (
    experienceId: string,
    data: CandidateExperienceRequest,
  ): Promise<ApiResponse<CandidateProfileResponseDto>> => {
    return request.put<ApiResponse<CandidateProfileResponseDto>, CandidateExperienceRequest>(
      endpoints.candidate.profileExperienceDetail(experienceId),
      data,
    );
  },

  deleteExperience: async (experienceId: string): Promise<ApiResponse<CandidateProfileResponseDto>> => {
    return request.delete<ApiResponse<CandidateProfileResponseDto>>(
      endpoints.candidate.profileExperienceDetail(experienceId),
    );
  },

  parseResume: async (
    file: File,
  ): Promise<ApiResponse<CandidateResumeParseResponseDto>> => {
    const formData = new FormData();
    formData.append("resume", file);

    return request.post<ApiResponse<CandidateResumeParseResponseDto>, FormData>(
      endpoints.candidate.profileResumeParse,
      formData,
      {
        timeout: 190000,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  uploadResume: async (
    file: File,
  ): Promise<ApiResponse<{ resumeId: string; fileName: string; uploadedAt: string; version: number; isCurrent: boolean }>> => {
    const formData = new FormData();
    formData.append("resume", file);

    return request.post<ApiResponse<{ resumeId: string; fileName: string; uploadedAt: string; version: number; isCurrent: boolean }>, FormData>(
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
