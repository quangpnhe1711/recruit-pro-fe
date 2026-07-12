import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession, type MockHandler } from "./support/session";

// E2E-AI-V2-001..007 — v2 AI Copilot acceptance hardening.
// Deterministic: seeded HR session + Playwright /api/** route mocks. No live backend or AI provider.

const JOB = {
  jobId: "job-1",
  title: "Backend Engineer",
  description: "Build APIs",
  requirements: ["3+ years .NET"],
  requiredSkills: ["C#", "PostgreSQL"],
};

const CANDIDATE = {
  candidateUserId: "cand-1",
  applicationId: "app-fit",
  fullName: "Nguyễn An",
  education: "Đại học Bách Khoa",
  experienceYears: 4,
  skills: ["C#", "PostgreSQL", "Azure"],
  cvSummary: "Built .NET APIs with PostgreSQL.",
  resumeUrl: null,
};

const PROMPT_TEMPLATE = {
  templateId: "tpl-1",
  name: "Fit analysis template",
  templateType: "fit_analysis",
  prompt: "Use ATS evidence only.",
  isActive: true,
  createdAt: "2026-06-30T09:00:00Z",
  updatedAt: "2026-06-30T09:10:00Z",
};

const PROVIDER_ARTIFACT = {
  artifactId: "artifact-provider-1",
  ownerUserId: "u-hr-1",
  jobId: "job-1",
  applicationId: "app-fit",
  artifactType: "candidate_search",
  prompt: "Find backend candidates",
  payloadJson: JSON.stringify({
    query: "Find backend candidates",
    results: [
      {
        candidateUserId: "cand-1",
        applicationId: "app-fit",
        fullName: "Nguyễn An",
        evidence: "Provider grounded evidence",
      },
    ],
  }),
  providerName: "test-provider",
  modelName: "test-model",
  fallbackUsed: false,
  createdAt: "2026-06-30T10:00:00Z",
};

const FALLBACK_ARTIFACT = {
  artifactId: "artifact-fallback-1",
  ownerUserId: "u-hr-1",
  jobId: "job-1",
  applicationId: null,
  artifactType: "email_draft",
  prompt: "Invite candidate",
  payloadJson: JSON.stringify({
    subject: "Interview invitation",
    body: "Fallback email body preview",
    evidence: ["Candidate: Nguyễn An"],
  }),
  providerName: "deterministic-copilot",
  modelName: "deterministic-copilot-v2",
  fallbackUsed: true,
  createdAt: "2026-06-30T10:05:00Z",
};

const MISSING_METADATA_ARTIFACT = {
  artifactId: "artifact-missing-metadata-1",
  ownerUserId: "u-hr-1",
  jobId: "job-1",
  applicationId: null,
  artifactType: "shortlist_suggestion",
  prompt: "Shortlist",
  payloadJson: JSON.stringify({
    suggestions: [
      {
        fullName: "Nguyễn An",
        recommendation: "Proceed to interview",
      },
    ],
  }),
  providerName: "",
  modelName: "",
  fallbackUsed: false,
  createdAt: "2026-06-30T10:10:00Z",
};

function applicationDetail(applicationId: string) {
  return {
    applicationId,
    referenceCode: "APP-001",
    stageLabel: "Screening",
    status: "Screening",
    offerStatus: null,
    appliedAt: "2026-06-28T08:00:00Z",
    nextStep: "Review application",
    candidate: {
      id: "cand-1",
      fullName: "Nguyễn An",
      email: "nguyen.an@test.local",
      phone: "0900000000",
      avatarUrl: null,
      currentPosition: "Backend Engineer",
      experienceYears: 4,
      education: "Đại học Bách Khoa",
      address: "Hà Nội",
      bio: "Backend developer",
      linkedinUrl: null,
      githubUrl: null,
      skills: ["C#", "PostgreSQL"],
    },
    job: {
      id: "job-1",
      title: "Backend Engineer",
      departmentName: "Engineering",
      requiredSkills: ["C#", "PostgreSQL"],
    },
    insights: {
      skillsMatchPercent: 90,
      matchedSkillCount: 2,
      requiredSkillCount: 2,
      submittedInterviewNotes: 0,
      totalInterviews: 0,
    },
    interviews: [],
    reviewedBy: null,
    assignedRecruiterId: "u-hr-1",
    assignedRecruiterName: "Nguyễn Thục Uyên",
    assignedRecruiterEmail: "hr@test.local",
    assignedDepartmentHeadId: null,
    assignedDepartmentHeadName: null,
    assignedDepartmentHeadEmail: null,
  };
}

function fitAnalysisSnapshot(overrides: Record<string, unknown> = {}) {
  return {
    fitAnalysisId: "fit-1",
    auditId: "audit-fit-1",
    jobId: "job-1",
    candidateUserId: "cand-1",
    applicationId: "app-fit",
    fullName: "Nguyễn An",
    fitLabel: "StrongFit",
    confidenceScore: 92,
    totalScore: 88,
    strengths: ["Strong C# API experience"],
    gaps: ["Limited DevOps evidence"],
    evidence: ["Built .NET APIs with PostgreSQL."],
    summary: "Strong provider-backed fit summary.",
    providerName: "fit-provider",
    modelName: "fit-model",
    fallbackUsed: false,
    createdAt: "2026-06-30T10:15:00Z",
    ...overrides,
  };
}

function copilotBaseMocks(extra: MockHandler[] = []): MockHandler[] {
  return [
    {
      method: "GET",
      match: /\/api\/copilot\/jobs$/,
      json: ok([{ jobId: "job-1", title: "Backend Engineer", status: "Approved", applicationCount: 1 }]),
    },
    {
      method: "POST",
      match: /\/api\/copilot\/conversations$/,
      json: ok({ conversationId: "conv-1", jobId: "job-1", title: "Backend Engineer", latestRankingSessionId: null }),
    },
    {
      method: "GET",
      match: /\/api\/copilot\/jobs\/job-1\/candidates$/,
      json: ok({ job: JOB, candidates: [CANDIDATE] }),
    },
    { method: "GET", match: /\/api\/copilot\/jobs\/job-1\/rules$/, json: ok([]) },
    {
      method: "GET",
      match: /\/api\/copilot\/conversations\/conv-1$/,
      json: ok({ conversationId: "conv-1", jobId: "job-1", title: "Backend Engineer", latestRankingSessionId: null, messages: [] }),
    },
    {
      method: "GET",
      match: /\/api\/copilot\/prompt-templates$/,
      json: ok([PROMPT_TEMPLATE]),
    },
    ...extra,
  ];
}

// E2E-AI-V2-001 — application review detail renders latest persisted fit-analysis snapshot.
test("E2E-AI-V2-001 latest fit-analysis card shows snapshot and provider metadata", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    { method: "GET", match: /\/api\/hr\/applications\/app-fit$/, json: ok(applicationDetail("app-fit")) },
    { method: "GET", match: /\/api\/hr\/applications\/app-fit\/cv$/, json: ok(null) },
    {
      method: "GET",
      match: /\/api\/copilot\/applications\/app-fit\/fit-analysis\/latest$/,
      json: ok(fitAnalysisSnapshot()),
    },
  ]);

  await page.goto("/hr/applications/app-fit");

  await expect(page.getByText("AI fit analysis")).toBeVisible();
  await expect(page.getByText("StrongFit")).toBeVisible();
  await expect(page.getByText("Strong provider-backed fit summary.")).toBeVisible();
  await expect(page.getByText("Strong C# API experience")).toBeVisible();
  await expect(page.getByText(/provider\/model fit-provider\/fit-model/)).toBeVisible();
  await expect(page.getByText("fallback=false")).toBeVisible();
});

// E2E-AI-V2-002 — application review detail renders clean empty state when no snapshot exists.
test("E2E-AI-V2-002 latest fit-analysis card shows empty state", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    { method: "GET", match: /\/api\/hr\/applications\/app-empty$/, json: ok(applicationDetail("app-empty")) },
    { method: "GET", match: /\/api\/hr\/applications\/app-empty\/cv$/, json: ok(null) },
    {
      method: "GET",
      match: /\/api\/copilot\/applications\/app-empty\/fit-analysis\/latest$/,
      json: ok(null),
    },
  ]);

  await page.goto("/hr/applications/app-empty");

  await expect(page.getByText("AI fit analysis")).toBeVisible();
  await expect(page.getByText(/Chưa có fit analysis đã lưu/)).toBeVisible();
});

// E2E-AI-V2-003 — artifact history displays provider/fallback/missing metadata and previews.
// SKIPPED: the "Artifact history" panel was removed from /hr/ai-copilot in the table-first
// "ranking = single source of truth" rebuild (candidate-search / email-draft artifacts deprecated).
// Re-enable only if the artifact-history surface returns.
test.skip("E2E-AI-V2-003 artifact history loads artifacts and metadata", async ({ page }) => {
  const requests: string[] = [];
  await seedSession(page, "hr");
  await installApiMocks(
    page,
    copilotBaseMocks([
      {
        method: "GET",
        match: /\/api\/copilot\/artifacts$/,
        json: (url) => {
          const artifactType = url.searchParams.get("artifactType");
          if (artifactType === "email_draft") return ok([FALLBACK_ARTIFACT]);
          return ok([PROVIDER_ARTIFACT, FALLBACK_ARTIFACT, MISSING_METADATA_ARTIFACT]);
        },
      },
    ]),
    {
      onRequest: (method, url) => {
        if (method === "GET" && /\/api\/copilot\/artifacts$/.test(url.pathname)) {
          requests.push(url.search);
        }
      },
    },
  );

  await page.goto("/hr/ai-copilot");

  await expect(page.getByText("Artifact history", { exact: true })).toBeVisible();
  await expect(page.getByText("Find backend candidates")).toBeVisible();
  await expect(page.getByText("candidate search")).toBeVisible();
  await expect(page.getByText("Provider grounded evidence")).toBeVisible();
  await expect(page.getByText(/provider\/model test-provider\/test-model/)).toBeVisible();
  await expect(page.getByText("fallback=false").first()).toBeVisible();
  await expect(page.getByText("Interview invitation")).toBeVisible();
  await expect(page.getByText("Fallback email body preview")).toBeVisible();
  await expect(page.getByText(/provider\/model deterministic-copilot\/deterministic-copilot-v2/)).toBeVisible();
  await expect(page.getByText("fallback=true")).toBeVisible();
  await expect(page.getByText(/unknown-provider\/unknown-model/)).toBeVisible();
  expect(requests.some((search) => search.includes("jobId=job-1"))).toBeTruthy();

  await page.getByRole("button", { name: /Tất cả artifact/ }).click();
  await page.getByRole("option", { name: /Email draft/ }).click();

  await expect(page.getByText("Interview invitation")).toBeVisible();
  await expect(page.getByText("Find backend candidates")).toHaveCount(0);
  await expect
    .poll(() => requests.some((search) => search.includes("artifactType=email_draft")))
    .toBeTruthy();
});

// E2E-AI-V2-004 — artifact history empty and error states are visible.
// SKIPPED: artifact-history panel removed in the table-first Copilot rebuild (see E2E-AI-V2-003).
test.skip("E2E-AI-V2-004 artifact history handles empty and error states", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(
    page,
    copilotBaseMocks([
      { method: "GET", match: /\/api\/copilot\/artifacts$/, json: ok([]) },
    ]),
  );

  await page.goto("/hr/ai-copilot");
  await expect(page.getByText("Chưa có artifact nào cho job/filter hiện tại.")).toBeVisible();

  await seedSession(page, "hr");
  await installApiMocks(
    page,
    copilotBaseMocks([
      {
        method: "GET",
        match: /\/api\/copilot\/artifacts$/,
        status: 500,
        json: { success: false, message: "Artifact service unavailable" },
      },
    ]),
  );

  await page.goto("/hr/ai-copilot");
  await expect(page.getByText(/Artifact service unavailable|Không tải được artifact history/)).toBeVisible();
});

// E2E-AI-V2-005 — prompt template list/detail and create flow.
// SKIPPED: the "Prompt templates" panel was removed from /hr/ai-copilot in the table-first rebuild.
// Re-enable only if the prompt-template management surface returns.
test.skip("E2E-AI-V2-005 prompt template list create and detail work without edit delete versioning UI", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(
    page,
    copilotBaseMocks([
      { method: "GET", match: /\/api\/copilot\/artifacts$/, json: ok([]) },
      {
        method: "POST",
        match: /\/api\/copilot\/prompt-templates$/,
        json: (_url, body) => {
          const payload = body ? JSON.parse(body) as Record<string, unknown> : {};
          return ok({
            templateId: "tpl-created",
            name: payload.name,
            templateType: payload.templateType,
            prompt: payload.prompt,
            isActive: payload.isActive,
            createdAt: "2026-06-30T11:00:00Z",
            updatedAt: "2026-06-30T11:00:00Z",
          });
        },
      },
    ]),
  );

  await page.goto("/hr/ai-copilot");

  await expect(page.getByText("Prompt templates")).toBeVisible();
  await expect(page.getByRole("button", { name: "Fit analysis template" })).toBeVisible();
  await expect(page.getByText("fit_analysis")).toBeVisible();
  await expect(page.locator("span").filter({ hasText: /^active$/ })).toBeVisible();
  await expect(page.getByText("Use ATS evidence only.")).toBeVisible();

  await page.getByPlaceholder("Tên template").fill("Candidate search template");
  await page.getByPlaceholder("Use case/type").fill("candidate_search");
  await page.getByPlaceholder("Nội dung prompt").fill("Prioritize {{jobTitle}} evidence.");
  await page.getByRole("button", { name: "Tạo template" }).click();

  await expect(page.getByRole("button", { name: "Candidate search template" })).toBeVisible();
  await expect(page.getByText("candidate_search")).toBeVisible();
  await expect(page.getByText("Prioritize {{jobTitle}} evidence.")).toBeVisible();
  await expect(page.getByText(/created/)).toBeVisible();
  await expect(page.getByText(/updated/)).toBeVisible();
  await expect(page.getByText(/edit|delete|versioning|Chỉnh sửa|Xóa template|Phiên bản/i)).toHaveCount(0);
});

// E2E-AI-V2-006 — prompt template client validation prevents unsupported empty create.
// SKIPPED: prompt-template panel removed in the table-first Copilot rebuild (see E2E-AI-V2-005).
test.skip("E2E-AI-V2-006 prompt template validation shows required-field feedback", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(
    page,
    copilotBaseMocks([
      { method: "GET", match: /\/api\/copilot\/artifacts$/, json: ok([]) },
    ]),
  );

  await page.goto("/hr/ai-copilot");
  await page.getByRole("button", { name: "Tạo template" }).click();
  await expect(page.getByText("Tên template và nội dung prompt là bắt buộc.")).toBeVisible();
});

// E2E-AI-V2-007 — fallback fit metadata is rendered explicitly.
test("E2E-AI-V2-007 latest fit-analysis card shows fallback metadata", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    { method: "GET", match: /\/api\/hr\/applications\/app-fallback$/, json: ok(applicationDetail("app-fallback")) },
    { method: "GET", match: /\/api\/hr\/applications\/app-fallback\/cv$/, json: ok(null) },
    {
      method: "GET",
      match: /\/api\/copilot\/applications\/app-fallback\/fit-analysis\/latest$/,
      json: ok(fitAnalysisSnapshot({
        applicationId: "app-fallback",
        providerName: "deterministic-copilot",
        modelName: "deterministic-copilot-v2",
        fallbackUsed: true,
      })),
    },
  ]);

  await page.goto("/hr/applications/app-fallback");

  await expect(page.getByText(/provider\/model deterministic-copilot\/deterministic-copilot-v2/)).toBeVisible();
  await expect(page.getByText("fallback=true")).toBeVisible();
});
