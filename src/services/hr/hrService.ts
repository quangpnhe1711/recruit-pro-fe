import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

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

export const hrService = {
  getDashboard: async (): Promise<ApiResponse<HrDashboardDto>> => {
    return request.get<ApiResponse<HrDashboardDto>>(endpoints.hr.dashboard);
  },

  getCandidates: async (params?: Record<string, unknown>): Promise<ApiResponse<HrCandidateItemDto[]>> => {
    const response = await request.get<ApiResponse<{ items?: HrCandidateItemDto[] }>>(endpoints.hr.candidates, {
      params: buildParams(params),
    });

    return {
      ...response,
      data: response.data?.items ?? [],
    };
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

  sendApplicationEmail: async (
    applicationId: string,
    data: { templateType: string; subject?: string; body?: string },
  ): Promise<ApiResponse<null>> => {
    return request.post<ApiResponse<null>, { templateType: string; subject?: string; body?: string }>(
      endpoints.hr.applicationSendEmail(applicationId),
      data,
    );
  },

  getInterviews: async (params?: Record<string, unknown>): Promise<ApiResponse<HrInterviewItemDto[]>> => {
    const response = await request.get<ApiResponse<{ items?: HrInterviewItemDto[] }>>(endpoints.hr.interviews, {
      params: buildParams(params),
    });

    return {
      ...response,
      data: response.data?.items ?? [],
    };
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
