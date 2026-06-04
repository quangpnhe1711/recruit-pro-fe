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
    name: string;
    roleLabel: string;
    appliedFor: string;
    avatarUrl: string;
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
    return request.get<ApiResponse<HrCandidateItemDto[]>>(endpoints.hr.candidates, {
      params: buildParams(params),
    });
  },

  getApplications: async (params?: Record<string, unknown>): Promise<ApiResponse<HrApplicationItemDto[]>> => {
    return request.get<ApiResponse<HrApplicationItemDto[]>>(endpoints.hr.applications, {
      params: buildParams(params),
    });
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
    return request.get<ApiResponse<HrInterviewItemDto[]>>(endpoints.hr.interviews, {
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

  getInterviewScheduleData: async (): Promise<ApiResponse<HrInterviewScheduleDataDto>> => {
    return request.get<ApiResponse<HrInterviewScheduleDataDto>>(endpoints.hr.interviewScheduleData);
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
