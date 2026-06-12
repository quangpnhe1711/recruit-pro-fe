import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";
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
};

export type HrInterviewItemDto = {
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
  status: "draft" | "confirmed";
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
    return request.patch<ApiResponse<ApplicationReviewDetailDto>, { decision: ApplicationReviewDecision }>(
      endpoints.hr.applicationDecision(applicationId),
      { decision },
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
