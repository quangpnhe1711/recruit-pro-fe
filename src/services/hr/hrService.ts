import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";
import type { InterviewStatus } from "../../common/status/interviewStatus";
import type {
  ApplicationReviewDecision,
  ApplicationReviewDetailDto,
  ManagerReviewQueueResponseDto,
  OfferEditorDto,
  UpsertOfferRequest,
} from "../../modules/jobs/jobsSchema";

function buildParams<T extends Record<string, unknown>>(params?: T) {
  if (!params) return undefined;

  const cleaned = Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""),
  );

  return Object.keys(cleaned).length ? cleaned : undefined;
}

export type HrDashboardDto = {
  stats: {
    activePostings: number;
    totalApplicants: number;
    interviewsToday: number;
    nextInterviewLabel: string;
  };
  recentApplications: Array<{
    applicationId: string;
    candidateName: string;
    jobAppliedFor: string;
    status: string;
    date: string;
  }>;
  pendingApprovals: Array<{
    jobId: string;
    title: string;
    meta: string;
    approverCount: number;
  }>;
  hiringVelocity: {
    averageTimeToHireDays: number;
    changePercent: number;
  };
  diversityReport: {
    targetCompletionPercent: number;
  };
};

export type HrCandidateItemDto = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  avatarUrl: string;
  source: string;
  appliedDate: string;
  status: string;
};

export type HrCandidateDetailDto = {
  profile: {
    id: string;
    name: string;
    avatarUrl: string | null;
    headline: string;
    email: string;
    phone: string | null;
    location: string;
    memberSince: string;
    bio: string | null;
    github: string | null;
    linkedin: string | null;
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
  applicationHistory: Array<{
    applicationId: string;
    jobId: string;
    jobTitle: string;
    departmentName: string;
    status: string;
    appliedAt: string | null;
    interviewCount: number;
  }>;
  interviewHistory: Array<{
    interviewId: string;
    applicationId: string;
    jobId: string;
    jobTitle: string;
    departmentName: string;
    interviewDate: string;
    status: string;
    notes: string | null;
  }>;
};

export type HrPagedItemsResponseDto<T> = {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
};

export type HrApplicationItemDto = {
  id: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string;
  };
  job: {
    id: string;
    title: string;
    department: string;
  };
  appliedDate: string;
  status: string;
  recruiter: string;
  score: number | null;
};

export type HrInterviewItemDto = {
  id: string;
  applicationId: string;
  candidateName: string;
  candidateEmail: string;
  jobTitle: string;
  interviewer: string;
  dateLabel: string;
  timeLabel: string;
  startAt: string;
  endAt: string;
  status: string;
  meetingType?: string;
  meetingLink?: string | null;
  location?: string | null;
  candidateConfirmedAt?: string | null;
  // Scorecard summary (internal HR list only).
  evaluationOverallScore?: number | null;
  evaluationRecommendation?: string | null;
};

// Post-interview scorecard (one per interview).
export type HrInterviewEvaluationDto = {
  interviewId: string;
  evaluatorId?: string | null;
  evaluatorName?: string | null;
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  overallScore: number;
  recommendation: string; // StrongHire | Hire | NoHire | StrongNoHire
  strengths?: string | null;
  concerns?: string | null;
  notes?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type HrInterviewEvaluationPayload = {
  technicalScore: number;
  communicationScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  recommendation: string;
  strengths?: string | null;
  concerns?: string | null;
  notes?: string | null;
};

export type HrInterviewScheduleDataDto = {
  candidate: {
    id: string;
    applicationId: string;
    jobId: string;
    name: string;
    roleLabel: string;
    appliedFor: string;
    avatarUrl: string | null;
  };
  interviewers: Array<{
    id: string;
    name: string;
    title: string;
    avatarUrl: string;
    busySlotsByDate: Record<string, number[]>;
  }>;
  slotMinutes: number[];
};

export type CreateInterviewRequest = {
  candidateId: string;
  applicationId: string;
  jobId: string;
  date: string;
  startMinutes: number;
  durationMinutes: number;
  mode: "video" | "inPerson";
  locationOrLink: string;
  interviewerId: string;
  // Persisted interview status only — canonical backend InterviewStatus (Scheduled/Completed/Canceled).
  // Local scheduling-form draft state (e.g. InterviewDraftState) must NOT be sent here. Optional: the
  // backend defaults to Scheduled when omitted.
  status?: InterviewStatus;
};

export type CandidateImportPreviewRowDto = {
  rowNumber: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  source: string;
  positionApplied: string;
  notes: string;
  isValid: boolean;
  errors: string[];
};

export type CandidateImportPreviewResponseDto = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  rows: CandidateImportPreviewRowDto[];
};

export type CandidateImportResultDto = {
  importedCount: number;
  skippedCount: number;
  createdCandidateIds: string[];
  invitationEmails: string[];
};

export const hrService = {
  getDashboard: async (): Promise<ApiResponse<HrDashboardDto>> => {
    return request.get<ApiResponse<HrDashboardDto>>(endpoints.hr.dashboard);
  },

  getCandidates: async (
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<HrPagedItemsResponseDto<HrCandidateItemDto>>> => {
    return request.get<ApiResponse<HrPagedItemsResponseDto<HrCandidateItemDto>>>(endpoints.hr.candidates, {
      params: buildParams(params),
    });
  },

  getCandidateDetail: async (
    candidateId: string,
  ): Promise<ApiResponse<HrCandidateDetailDto>> => {
    return request.get<ApiResponse<HrCandidateDetailDto>>(
      endpoints.hr.candidateDetail(candidateId),
    );
  },

  downloadCandidateImportTemplate: async (): Promise<Blob> => {
    return request.get<Blob>(endpoints.candidates.importTemplate, {
      responseType: "blob",
    });
  },

  previewCandidateImport: async (
    file: File,
  ): Promise<ApiResponse<CandidateImportPreviewResponseDto>> => {
    const formData = new FormData();
    formData.append("file", file);

    return request.post<ApiResponse<CandidateImportPreviewResponseDto>, FormData>(
      endpoints.candidates.importPreview,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
  },

  importCandidates: async (
    rows: Array<{
      rowNumber: number;
      fullName: string;
      email: string;
      phoneNumber: string;
      source: string;
      positionApplied: string;
      notes: string;
    }>,
  ): Promise<ApiResponse<CandidateImportResultDto>> => {
    return request.post<ApiResponse<CandidateImportResultDto>, { rows: typeof rows }>(
      endpoints.candidates.importConfirm,
      { rows },
    );
  },

  getApplications: async (params?: Record<string, unknown>): Promise<ApiResponse<HrApplicationItemDto[]>> => {
    const response = await request.get<ApiResponse<{ items?: Array<{
      id: string;
      candidate: {
        id: string;
        fullName: string;
        email: string;
        avatarUrl?: string | null;
      };
      job: {
        id: string;
        title: string;
        department?: {
          name?: string;
        } | null;
      };
      appliedAt: string;
      status: string;
      score?: number | null;
      reviewedBy?: {
        fullName?: string;
      } | null;
    }> }>>(endpoints.hr.applications, {
      params: buildParams(params),
    });

    return {
      ...response,
      data: (response.data?.items ?? []).map((item) => {
        const nameParts = item.candidate.fullName.trim().split(/\s+/);
        return {
          id: item.id,
          candidate: {
            id: item.candidate.id,
            firstName: nameParts[0] ?? item.candidate.fullName,
            lastName: nameParts.slice(1).join(" "),
            email: item.candidate.email,
            avatarUrl: item.candidate.avatarUrl ?? "",
          },
          job: {
            id: item.job.id,
            title: item.job.title,
            department: item.job.department?.name ?? "",
          },
          appliedDate: item.appliedAt,
          status: item.status,
          recruiter: item.reviewedBy?.fullName ?? "Chưa phân công",
          score: item.score ?? null,
        };
      }),
    };
  },

  getApplicationCv: async (
    applicationId: string,
  ): Promise<ApiResponse<{ resumeId: string; fileName: string; fileUrl: string }>> => {
    return request.get<ApiResponse<{ resumeId: string; fileName: string; fileUrl: string }>>(
      endpoints.hr.applicationCv(applicationId),
    );
  },

  getApplicationDetail: async (
    applicationId: string,
  ): Promise<ApiResponse<ApplicationReviewDetailDto>> => {
    return request.get<ApiResponse<ApplicationReviewDetailDto>>(
      endpoints.hr.applicationDetail(applicationId),
    );
  },

  updateApplicationDecision: async (
    applicationId: string,
    decision: ApplicationReviewDecision,
  ): Promise<ApiResponse<ApplicationReviewDetailDto>> => {
    return request.patch<ApiResponse<ApplicationReviewDetailDto>, { targetStatus: ApplicationReviewDecision }>(
      endpoints.hr.applicationDecision(applicationId),
      { targetStatus: decision },
    );
  },

  getOfferEditor: async (
    applicationId: string,
  ): Promise<ApiResponse<OfferEditorDto>> => {
    return request.get<ApiResponse<OfferEditorDto>>(
      endpoints.hr.applicationOffer(applicationId),
    );
  },

  saveOfferDraft: async (
    applicationId: string,
    data: UpsertOfferRequest,
  ): Promise<ApiResponse<OfferEditorDto>> => {
    return request.put<ApiResponse<OfferEditorDto>, UpsertOfferRequest>(
      endpoints.hr.applicationOffer(applicationId),
      data,
    );
  },

  sendOffer: async (
    applicationId: string,
    data: UpsertOfferRequest,
  ): Promise<ApiResponse<OfferEditorDto>> => {
    return request.post<ApiResponse<OfferEditorDto>, UpsertOfferRequest>(
      endpoints.hr.applicationOfferSend(applicationId),
      data,
    );
  },

  getManagerReviewQueue: async (
    params?: { page?: number; pageSize?: number; keyword?: string },
  ): Promise<ApiResponse<ManagerReviewQueueResponseDto>> => {
    return request.get<ApiResponse<ManagerReviewQueueResponseDto>>(
      endpoints.manager.reviewQueue,
      {
        params: buildParams(params),
      },
    );
  },

  sendApplicationEmail: async (
    applicationId: string,
    data: { templateType: string; subject?: string; body?: string },
  ): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>, { templateType: string; subject?: string; body?: string }>(
      endpoints.hr.applicationSendEmail(applicationId),
      data,
    );
  },

  // Rejection email flow: sends the rejection email and, only on success, transitions the application
  // to Rejected (the backend gates this — see ApplicationService.SendRejectionEmailAsync). Returns the
  // refreshed review detail so callers can re-render the new status.
  sendRejectionEmail: async (
    applicationId: string,
    data: { subject: string; body: string },
  ): Promise<ApiResponse<ApplicationReviewDetailDto>> => {
    return request.post<ApiResponse<ApplicationReviewDetailDto>, { subject: string; body: string }>(
      endpoints.hr.applicationRejectionEmail(applicationId),
      data,
    );
  },

  getInterviews: async (
    params?: Record<string, unknown>,
  ): Promise<ApiResponse<HrPagedItemsResponseDto<HrInterviewItemDto>>> => {
    return request.get<ApiResponse<HrPagedItemsResponseDto<HrInterviewItemDto>>>(endpoints.hr.interviews, {
      params: buildParams(params),
    });
  },

  updateInterviewStatus: async (
    interviewId: string,
    status: string,
  ): Promise<ApiResponse<null>> => {
    return request.patch<ApiResponse<null>, { status: string }>(
      endpoints.hr.interviewStatus(interviewId),
      { status },
    );
  },

  deleteInterview: async (interviewId: string): Promise<ApiResponse<null>> => {
    return request.delete<ApiResponse<null>>(endpoints.hr.interviewDetail(interviewId));
  },

  getInterviewEvaluation: async (
    interviewId: string,
  ): Promise<ApiResponse<HrInterviewEvaluationDto>> => {
    return request.get<ApiResponse<HrInterviewEvaluationDto>>(
      endpoints.hr.interviewEvaluation(interviewId),
    );
  },

  saveInterviewEvaluation: async (
    interviewId: string,
    payload: HrInterviewEvaluationPayload,
  ): Promise<ApiResponse<HrInterviewEvaluationDto>> => {
    return request.put<ApiResponse<HrInterviewEvaluationDto>, HrInterviewEvaluationPayload>(
      endpoints.hr.interviewEvaluation(interviewId),
      payload,
    );
  },

  getInterviewScheduleData: async (
    params?: { applicationId?: string },
  ): Promise<ApiResponse<HrInterviewScheduleDataDto>> => {
    return request.get<ApiResponse<HrInterviewScheduleDataDto>>(endpoints.hr.interviewScheduleData, {
      params: buildParams(params),
    });
  },

  createInterview: async (
    data: CreateInterviewRequest,
  ): Promise<ApiResponse<{ interviewId: string }>> => {
    return request.post<ApiResponse<{ interviewId: string }>, CreateInterviewRequest>(
      endpoints.hr.createInterview,
      data,
    );
  },
};
