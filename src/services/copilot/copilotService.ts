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
  // v2: ATS status ("Screening", "ManagerReview", ...). Ranking only evaluates Screening; the
  // "Pass CV / Chuyển sang Head Review" action is only enabled for Screening candidates.
  status: string;
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
  // v2: fit-style evaluation generated at ranking time. Machine values (StrongFit/PotentialFit/
  // RiskFit/NotRecommended) stay in English; summary/evidence prose is Vietnamese.
  fitLabel: string;
  confidenceScore: number;
  evidence: string[];
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
  // v2 idempotency: true when unchanged input returned the latest matching session instead of a
  // fresh AI ranking. Warnings surface metadata such as "ranking-session:reused".
  reusedRankingSession?: boolean;
  warnings?: string[];
};

export type PassCvResultDto = {
  updated: Array<{ applicationId: string; oldStatus: string; newStatus: string }>;
  skipped: Array<{ applicationId: string; reason: string }>;
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

export type CopilotAiMetadataDto = {
  auditId: string;
  artifactId: string | null;
  fallbackUsed: boolean;
  providerName: string;
  modelName: string;
  warnings: string[];
};

export type CopilotPromptTemplateDto = {
  templateId: string;
  name: string;
  templateType: string;
  prompt: string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type CandidateFitAnalysisSnapshotDto = {
  fitAnalysisId: string;
  auditId: string;
  jobId: string;
  candidateUserId: string;
  applicationId: string;
  fullName: string;
  fitLabel: string;
  confidenceScore: number;
  totalScore: number;
  strengths: string[];
  gaps: string[];
  evidence: string[];
  summary: string;
  providerName: string;
  modelName: string;
  fallbackUsed: boolean;
  createdAt: string | null;
};

export type CopilotGeneratedArtifactDto = {
  artifactId: string;
  ownerUserId: string;
  jobId: string | null;
  applicationId: string | null;
  artifactType: string;
  prompt: string;
  payloadJson: string;
  providerName: string;
  modelName: string;
  fallbackUsed: boolean;
  createdAt: string | null;
};

export type NaturalLanguageCandidateSearchResponseDto = {
  normalizedIntent: string;
  query: string;
  extractedFilters: CopilotPromptResponseDto["normalizedRules"];
  results: Array<{
    candidateUserId: string;
    applicationId: string;
    fullName: string;
    matchScore: number;
    matchedSkills: string[];
    missingSkills: string[];
    evidence: string;
  }>;
  ai: CopilotAiMetadataDto;
};

export type CandidateFitAnalysisResponseDto = {
  jobId: string;
  analyses: Array<{
    candidateUserId: string;
    applicationId: string;
    fullName: string;
    fitLabel: string;
    confidenceScore: number;
    totalScore: number;
    strengths: string[];
    gaps: string[];
    evidence: string[];
    summary: string;
  }>;
  ai: CopilotAiMetadataDto;
};

export type InterviewQuestionSetDto = {
  jobId: string;
  candidateUserId: string | null;
  focus: string;
  questions: Array<{
    category: string;
    question: string;
    evidence: string;
  }>;
  ai: CopilotAiMetadataDto;
};


export type HrEmailDraftResponseDto = {
  applicationId: string;
  templateType: string;
  subject: string;
  body: string;
  evidence: string[];
  ai: CopilotAiMetadataDto;
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

  searchCandidates: async (
    payload: { jobId: string; query: string; maxResults?: number },
  ): Promise<ApiResponse<NaturalLanguageCandidateSearchResponseDto>> => {
    return request.post<ApiResponse<NaturalLanguageCandidateSearchResponseDto>, typeof payload>(
      endpoints.copilot.candidateSearch,
      payload,
    );
  },

  analyzeFit: async (
    jobId: string,
    payload: { candidateUserIds?: string[]; applicationIds?: string[]; prompt?: string },
  ): Promise<ApiResponse<CandidateFitAnalysisResponseDto>> => {
    return request.post<ApiResponse<CandidateFitAnalysisResponseDto>, typeof payload>(
      endpoints.copilot.fitAnalysis(jobId),
      payload,
    );
  },

  generateInterviewQuestions: async (
    jobId: string,
    payload: { candidateUserId?: string; applicationId?: string; focus?: string; questionCount?: number },
  ): Promise<ApiResponse<InterviewQuestionSetDto>> => {
    return request.post<ApiResponse<InterviewQuestionSetDto>, typeof payload>(
      endpoints.copilot.interviewQuestions(jobId),
      payload,
    );
  },

  draftEmail: async (
    applicationId: string,
    payload: { templateType?: string; tone?: string; additionalInstruction?: string },
  ): Promise<ApiResponse<HrEmailDraftResponseDto>> => {
    return request.post<ApiResponse<HrEmailDraftResponseDto>, typeof payload>(
      endpoints.copilot.emailDraft(applicationId),
      payload,
    );
  },

  getPromptTemplates: async (): Promise<ApiResponse<CopilotPromptTemplateDto[]>> => {
    return request.get<ApiResponse<CopilotPromptTemplateDto[]>>(
      endpoints.copilot.promptTemplates,
    );
  },

  createPromptTemplate: async (
    payload: { name: string; templateType?: string; prompt: string; isActive?: boolean },
  ): Promise<ApiResponse<CopilotPromptTemplateDto>> => {
    return request.post<ApiResponse<CopilotPromptTemplateDto>, typeof payload>(
      endpoints.copilot.promptTemplates,
      {
        ...payload,
        templateType: payload.templateType ?? "general",
        isActive: payload.isActive ?? true,
      },
    );
  },

  getLatestFitAnalysis: async (
    applicationId: string,
  ): Promise<ApiResponse<CandidateFitAnalysisSnapshotDto>> => {
    return request.get<ApiResponse<CandidateFitAnalysisSnapshotDto>>(
      endpoints.copilot.latestFitAnalysis(applicationId),
    );
  },

  getGeneratedArtifacts: async (
    params?: { jobId?: string; applicationId?: string; artifactType?: string; take?: number },
  ): Promise<ApiResponse<CopilotGeneratedArtifactDto[]>> => {
    return request.get<ApiResponse<CopilotGeneratedArtifactDto[]>>(
      endpoints.copilot.artifacts,
      { params },
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
      {
        timeout: 190000,
      },
    );
  },

  // v2 §7: explicit HR action — pass selected ranked candidates from CV screening to Head Review.
  passCvToHeadReview: async (
    rankingSessionId: string,
    payload: { applicationIds: string[]; note?: string },
  ): Promise<ApiResponse<PassCvResultDto>> => {
    return request.post<ApiResponse<PassCvResultDto>, typeof payload>(
      endpoints.copilot.passCv(rankingSessionId),
      payload,
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
