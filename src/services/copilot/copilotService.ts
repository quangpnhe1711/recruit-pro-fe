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

export type CopilotMessageDto = {
  messageId: string;
  role: "User" | "Assistant" | "System";
  content: string;
  metadataJson: string | null;
  sequenceNo: number;
  createdAt: string | null;
};

export type CopilotConversationDetailDto = CopilotConversationDto & {
  messages: CopilotMessageDto[];
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
  isAiGenerated: boolean;
};

export type CopilotPromptResponseDto = {
  conversationId: string;
  rankingSessionId: string | null;
  didRank: boolean;
  assistantMessage: string;
  normalizedRules: {
    requiredSkills: string[];
    preferredSkills: string[];
    minExperienceYears: number | null;
    priorityCriteria: CopilotRuleCriterionDto[];
    negativeCriteria: CopilotRuleCriterionDto[];
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

export type CopilotRuleCriterionDto = {
  label: string;
  field: string;
  operator: string;
  value: string;
  weight: string;
  autoReject: boolean;
};

export type CopilotRankingSessionDetailDto = {
  rankingSessionId: string;
  conversationId: string;
  jobId: string;
  userPrompt: string;
  modelName: string | null;
  totalCandidates: number;
  promptTokens: number | null;
  completionTokens: number | null;
  createdAt: string | null;
  normalizedRules: CopilotPromptResponseDto["normalizedRules"];
  results: CopilotRankingResultDto[];
};

export type CopilotSavedRuleDto = {
  ruleId: string;
  jobId: string;
  name: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  rule: CopilotPromptResponseDto["normalizedRules"];
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

  getConversation: async (
    conversationId: string,
  ): Promise<ApiResponse<CopilotConversationDetailDto>> => {
    return request.get<ApiResponse<CopilotConversationDetailDto>>(
      endpoints.copilot.conversationDetail(conversationId),
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
    payload: {
      jobId: string;
      prompt: string;
      forceRanking?: boolean;
      useLatestRankingContext?: boolean;
      priorityCriteria?: CopilotRuleCriterionDto[];
      negativeCriteria?: CopilotRuleCriterionDto[];
    },
  ): Promise<ApiResponse<CopilotPromptResponseDto>> => {
    const requestPayload: typeof payload = {
      jobId: payload.jobId,
      prompt: payload.prompt,
      forceRanking: payload.forceRanking ?? false,
      useLatestRankingContext: payload.useLatestRankingContext ?? true,
    };

    if (payload.priorityCriteria?.length) {
      requestPayload.priorityCriteria = payload.priorityCriteria;
    }

    if (payload.negativeCriteria?.length) {
      requestPayload.negativeCriteria = payload.negativeCriteria;
    }

    return request.post<ApiResponse<CopilotPromptResponseDto>, typeof payload>(
      endpoints.copilot.rankings(conversationId),
      requestPayload,
    );
  },

  getRankingSession: async (
    rankingSessionId: string,
  ): Promise<ApiResponse<CopilotRankingSessionDetailDto>> => {
    return request.get<ApiResponse<CopilotRankingSessionDetailDto>>(
      endpoints.copilot.rankingSession(rankingSessionId),
    );
  },

  getSavedRules: async (
    jobId: string,
  ): Promise<ApiResponse<CopilotSavedRuleDto[]>> => {
    return request.get<ApiResponse<CopilotSavedRuleDto[]>>(
      endpoints.copilot.rules(jobId),
    );
  },

  createSavedRule: async (
    jobId: string,
    payload: {
      name: string;
      priorityCriteria: CopilotRuleCriterionDto[];
      negativeCriteria: CopilotRuleCriterionDto[];
      isActive?: boolean;
    },
  ): Promise<ApiResponse<CopilotSavedRuleDto>> => {
    return request.post<ApiResponse<CopilotSavedRuleDto>, typeof payload>(
      endpoints.copilot.rules(jobId),
      {
        ...payload,
        isActive: payload.isActive ?? true,
      },
    );
  },

  updateSavedRuleStatus: async (
    ruleId: string,
    isActive: boolean,
  ): Promise<ApiResponse<CopilotSavedRuleDto>> => {
    return request.patch<ApiResponse<CopilotSavedRuleDto>, { isActive: boolean }>(
      endpoints.copilot.ruleDetail(ruleId),
      { isActive },
    );
  },

  deleteSavedRule: async (
    ruleId: string,
  ): Promise<ApiResponse<{ ruleId: string }>> => {
    return request.delete<ApiResponse<{ ruleId: string }>>(
      endpoints.copilot.ruleDetail(ruleId),
    );
  },
};
