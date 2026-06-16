export const endpoints = {
  auth: {
    login: "/auth/login",
    candidateLogin: "/auth/candidate/login",
    internalLogin: "/auth/internal/login",
    candidateForgotPassword: "/auth/candidate/forgot-password",
    internalForgotPassword: "/auth/internal/forgot-password",
    logout: "/auth/logout",
  },
  public: {
    home: "/public/home",
    list: "/jobs",
    filters: "/jobs/filters",
    detail: (jobId: string) => `/jobs/${jobId}`,
  },
  jobs: {
    list: "/jobs",
    filters: "/jobs/filters",
    detail: (jobId: string) => `/jobs/${jobId}`,
    applyContext: (jobId: string) => `/jobs/${jobId}/apply-context`,
    applications: (jobId: string) => `/jobs/${jobId}/applications`,
    recentApplications: (jobId: string) => `/jobs/${jobId}/applications/recent`,
    statistics: (jobId: string) => `/jobs/${jobId}/statistics`,
    apply: (jobId: string) => `/jobs/${jobId}/apply`,
  },
  candidates: {
    register: "/candidates/register",
    importTemplate: "/candidates/import/template",
    importPreview: "/candidates/import/preview",
    importConfirm: "/candidates/import",
  },
  candidate: {
    dashboard: "/candidate/dashboard",
    interviews: "/candidate/interviews",
    applications: "/candidate/applications",
    applicationWithdraw: (applicationId: string) =>
      `/candidate/applications/${applicationId}/withdraw`,
    applicationAcceptOffer: (applicationId: string) =>
      `/candidate/applications/${applicationId}/accept-offer`,
    applicationDeclineOffer: (applicationId: string) =>
      `/candidate/applications/${applicationId}/decline-offer`,
    profile: "/candidate/profile",
    profileSkills: "/candidate/profile/skills",
    profileExperience: "/candidate/profile/experience",
    profileExperienceDetail: (experienceId: string) =>
      `/candidate/profile/experience/${experienceId}`,
    profileResumeParse: "/candidate/profile/resume/parse",
    profileResume: "/candidate/profile/resume",
  },
  departments: "/departments",
  skills: "/skills",
  hr: {
    dashboard: "/hr/dashboard",
    candidates: "/hr/candidates",
    candidateDetail: (candidateId: string) => `/hr/candidates/${candidateId}`,
    applications: "/hr/applications",
    applicationDetail: (applicationId: string) =>
      `/hr/applications/${applicationId}`,
    applicationDecision: (applicationId: string) =>
      `/hr/applications/${applicationId}/decision`,
    applicationCv: (applicationId: string) =>
      `/hr/applications/${applicationId}/cv`,
    applicationOffer: (applicationId: string) =>
      `/hr/applications/${applicationId}/offer`,
    applicationOfferSend: (applicationId: string) =>
      `/hr/applications/${applicationId}/offer/send`,
    applicationSendEmail: (applicationId: string) =>
      `/hr/applications/${applicationId}/send-email`,
    interviews: "/hr/interviews",
    interviewStatus: (interviewId: string) =>
      `/hr/interviews/${interviewId}/status`,
    interviewDetail: (interviewId: string) => `/hr/interviews/${interviewId}`,
    interviewScheduleData: "/hr/interviews/schedule-data",
    createInterview: "/hr/interviews",
  },
  manager: {
    dashboard: "/manager/dashboard",
    reviewQueue: "/manager/applications/review-queue",
    jobApprovalQueue: "/manager/jobs/approval-queue",
    jobApprovalDetail: (jobId: string) =>
      `/manager/jobs/${jobId}/approval-detail`,
    recruitmentAnalytics: "/manager/reports/recruitment-analytics",
  },
  hrJobs: {
    list: "/hr/jobs",
    detail: (jobId: string) => `/hr/jobs/${jobId}`,
    status: (jobId: string) => `/hr/jobs/${jobId}/status`,
    applications: (jobId: string) => `/hr/jobs/${jobId}/applications`,
    funnel: (jobId: string) => `/hr/jobs/${jobId}/funnel`,
    pendingApproval: "/hr/jobs/pending-approval",
  },
  copilot: {
    jobs: "/copilot/jobs",
    conversations: "/copilot/conversations",
    conversationDetail: (conversationId: string) =>
      `/copilot/conversations/${conversationId}`,
    candidates: (jobId: string) => `/copilot/jobs/${jobId}/candidates`,
    rankings: (conversationId: string) =>
      `/copilot/conversations/${conversationId}/rankings`,
    rankingSession: (rankingSessionId: string) =>
      `/copilot/ranking-sessions/${rankingSessionId}`,
    rules: (jobId: string) => `/copilot/jobs/${jobId}/rules`,
    ruleDetail: (ruleId: string) => `/copilot/rules/${ruleId}`,
  },
} as const;
