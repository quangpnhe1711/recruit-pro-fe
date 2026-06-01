export const endpoints = {
  auth: {
    login: "/auth/login",
    logout: "/auth/logout",
  },
  jobs: {
    list: "/jobs",
    detail: (jobId: string) => `/jobs/${jobId}`,
    applications: (jobId: string) => `/jobs/${jobId}/applications`,
    funnel: (jobId: string) => `/jobs/${jobId}/funnel`,
  },
  departments: "/departments",
  skills: "/skills",
  hrJobs: {
    list: "/hr/jobs",
    detail: (jobId: string) => `/hr/jobs/${jobId}`,
    status: (jobId: string) => `/hr/jobs/${jobId}/status`,
    applications: (jobId: string) => `/hr/jobs/${jobId}/applications`,
    funnel: (jobId: string) => `/hr/jobs/${jobId}/funnel`,
    pendingApproval: "/hr/jobs/pending-approval",
  },
} as const;
