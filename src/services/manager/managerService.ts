import type { ApiResponse } from "../../common/types";
import { endpoints } from "../http/endpoints";
import { request } from "../http/request";

export type ManagerDashboardDto = {
  summary: {
    pendingApprovals: number;
    activeApplications: number;
    departmentCount: number;
    averageReviewCycleDays: number;
    averageReviewCycleLabel: string;
    acceptanceRate: number;
    acceptanceRateLabel: string;
  };
  pendingApprovals: Array<{
    jobId: string;
    title: string;
    meta: string;
    approverCount: number;
  }>;
  finalDecisions: Array<{
    applicationId: string;
    candidateName: string;
    jobTitle: string;
    recommendationNote: string;
    status: string;
    avatarUrl: string | null;
  }>;
  departmentHiringSpeed: Array<{
    departmentName: string;
    averageDays: number;
  }>;
  recruitmentFunnel: Array<{
    label: string;
    count: number;
  }>;
};

export type ManagerRecruitmentAnalyticsDto = {
  overview: {
    averageReviewCycleDays: number;
    averageReviewCycleDeltaPercent: number;
    activeCandidates: number;
    activeCandidatesDelta: number;
    pendingInterviews: number;
    pendingInterviewsDelta: number;
    offerAcceptanceRate: number;
    offerAcceptanceDeltaPercent: number;
  };
  trend: {
    labels: string[];
    applications: number[];
    completedInterviews: number[];
  };
  funnel: Array<{
    label: string;
    count: number;
    percentFromApplied: number;
  }>;
  distribution: {
    total: number;
    items: Array<{
      label: string;
      count: number;
      percent: number;
      colorToken: string;
    }>;
  };
  departmentPerformance: Array<{
    departmentName: string;
    activeApplications: number;
    offeredCandidates: number;
    acceptedCandidates: number;
    conversionPercent: number;
  }>;
  departmentBreakdown: Array<{
    departmentName: string;
    openRoles: number;
    averageReviewCycleDays: number;
    activePipeline: number;
    recruiterName: string;
  }>;
};

export const managerService = {
  getDashboard: async (): Promise<ApiResponse<ManagerDashboardDto>> => {
    return request.get<ApiResponse<ManagerDashboardDto>>(endpoints.manager.dashboard);
  },

  getRecruitmentAnalytics: async (): Promise<ApiResponse<ManagerRecruitmentAnalyticsDto>> => {
    return request.get<ApiResponse<ManagerRecruitmentAnalyticsDto>>(
      endpoints.manager.recruitmentAnalytics,
    );
  },
};
