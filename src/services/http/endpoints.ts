export const endpoints = {
  auth: {
    login: "/auth/login",
    candidateLogin: "/auth/candidate/login",
    internalLogin: "/auth/internal/login",
    logout: "/auth/logout",
  },
  public: {
    home: "/public/home",
  },
  jobs: {
    list: "/jobs",
    filters: "/jobs/filters",
    detail: (jobId: string) => `/jobs/${jobId}`,
    applications: (jobId: string) => `/jobs/${jobId}/applications`,
    recentApplications: (jobId: string) => `/jobs/${jobId}/applications/recent`,
    statistics: (jobId: string) => `/jobs/${jobId}/statistics`,
    apply: (jobId: string) => `/jobs/${jobId}/apply`,
  },
  candidates: {
    register: "/candidates/register",
  },
  candidate: {
    dashboard: "/candidate/dashboard",
    applications: "/candidate/applications",
    applicationWithdraw: (applicationId: string) =>
      `/candidate/applications/${applicationId}/withdraw`,
    applicationAcceptOffer: (applicationId: string) =>
      `/candidate/applications/${applicationId}/accept-offer`,
    profile: "/candidate/profile",
    profileSkills: "/candidate/profile/skills",
    profileExperience: "/candidate/profile/experience",
    profileExperienceDetail: (experienceId: string) =>
      `/candidate/profile/experience/${experienceId}`,
    profileResume: "/candidate/profile/resume",
  },
  departments: "/departments",
  skills: "/skills",
  hr: {
    dashboard: "/hr/dashboard",
    candidates: "/hr/candidates",
    applications: "/hr/applications",
    applicationCv: (applicationId: string) => `/hr/applications/${applicationId}/cv`,
    applicationSendEmail: (applicationId: string) =>
      `/hr/applications/${applicationId}/send-email`,
    interviews: "/hr/interviews",
    interviewStatus: (interviewId: string) => `/hr/interviews/${interviewId}/status`,
    interviewDetail: (interviewId: string) => `/hr/interviews/${interviewId}`,
    interviewScheduleData: "/hr/interviews/schedule-data",
    createInterview: "/hr/interviews",
  },
  hrJobs: {
    list: "/hr/jobs",
    detail: (jobId: string) => `/hr/jobs/${jobId}`,
    status: (jobId: string) => `/hr/jobs/${jobId}/status`,
    applications: (jobId: string) => `/hr/jobs/${jobId}/applications`,
    funnel: (jobId: string) => `/hr/jobs/${jobId}/funnel`,
    pendingApproval: "/hr/jobs/pending-approval",
  },
} as const;
