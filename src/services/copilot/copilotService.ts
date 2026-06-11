import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export type CopilotJobOptionDto = {
  jobId: string;
  title: string;
  status: string;
  applicationCount: number;
};

export type CopilotConversationDto = {
  conversationId: string;
  jobId: string;
  title: string;
  latestRankingSessionId: string | null;
};

export type CopilotCandidateDto = {
  candidateUserId: string;
  applicationId: string;
  fullName: string;
  education: string | null;
  experienceYears: number;
  skills: string[];
  cvSummary: string;
  resumeUrl: string | null;
};

export type CopilotCandidatePoolDto = {
  job: {
    jobId: string;
    title: string;
    description: string;
    requirements: string[];
    requiredSkills: string[];
  };
  candidates: CopilotCandidateDto[];
};

export type CopilotRankingResultDto = {
  candidateUserId: string;
  applicationId: string;
  fullName: string;
  rankPosition: number;
  totalScore: number;
  skillScore: number;
  experienceScore: number;
  educationScore: number;
  projectScore: number;
  recommendation: string;
  isAutoRejected: boolean;
  rejectReason: string | null;
  strengths: string[];
  weaknesses: string[];
  summary: string;
};

export type CopilotPromptResponseDto = {
  conversationId: string;
  rankingSessionId: string;
  normalizedRules: {
    requiredSkills: string[];
    preferredSkills: string[];
    minExperienceYears: number | null;
    autoRejectRules: Array<{
      field: string;
      operator: string;
      value: string;
      reason: string;
    }>;
    minTotalScore: number | null;
  };
  results: CopilotRankingResultDto[];
};

export const copilotService = {
  getJobs: async (): Promise<ApiResponse<CopilotJobOptionDto[]>> => {
    return request.get<ApiResponse<CopilotJobOptionDto[]>>(endpoints.copilot.jobs);
  },

  createConversation: async (
    jobId: string,
  ): Promise<ApiResponse<CopilotConversationDto>> => {
    return request.post<ApiResponse<CopilotConversationDto>, { jobId: string }>(
      endpoints.copilot.conversations,
      { jobId },
    );
  },

  getCandidatePool: async (
    jobId: string,
  ): Promise<ApiResponse<CopilotCandidatePoolDto>> => {
    return request.get<ApiResponse<CopilotCandidatePoolDto>>(
      endpoints.copilot.candidates(jobId),
    );
  },

  createRanking: async (
    conversationId: string,
    payload: { jobId: string; prompt: string; useLatestRankingContext?: boolean },
  ): Promise<ApiResponse<CopilotPromptResponseDto>> => {
    return request.post<ApiResponse<CopilotPromptResponseDto>, typeof payload>(
      endpoints.copilot.rankings(conversationId),
      {
        ...payload,
        useLatestRankingContext: payload.useLatestRankingContext ?? true,
      },
    );
  },
};
