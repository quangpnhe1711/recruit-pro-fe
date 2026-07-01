import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession, type MockHandler } from "./support/session";

// E2E-AI-001..006 — AI Copilot ranking table: no raw JSON, structured education, skills chips + overflow,
// neutral "not ranked" state, run-review updates the row, and malformed data never crashes the UI.
// Deterministic: seeded HR session + /api/** route mocks (no live AI backend).

type Candidate = {
  candidateUserId: string;
  applicationId: string;
  fullName: string;
  education: string | null;
  experienceYears: number;
  skills: string[];
  cvSummary: string;
  resumeUrl: string | null;
  status: string;
};

const JOB = {
  jobId: "job-1",
  title: "Backend Engineer",
  description: "Build APIs",
  requirements: ["3+ years .NET"],
  requiredSkills: ["C#", "PostgreSQL"],
};

function candidate(over: Partial<Candidate> = {}): Candidate {
  return {
    candidateUserId: "cand-1",
    applicationId: "app-1",
    fullName: "Bùi Hoàng Phúc",
    education:
      '[{"school":"National Economics University","degree":"Talent Acquisition Specialist","fieldOfStudy":"Human Resources","startYear":2018,"endYear":2022}]',
    experienceYears: 2,
    skills: ["Communication", "English", "Excel"],
    cvSummary: "HR specialist",
    resumeUrl: null,
    status: "Screening",
    ...over,
  };
}

const EMPTY_RULES = {
  requiredSkills: [],
  preferredSkills: [],
  minExperienceYears: null,
  priorityCriteria: [],
  negativeCriteria: [],
  autoRejectRules: [],
  minTotalScore: null,
};

function rankingResult(candidateUserId: string, fullName: string, totalScore: number) {
  return {
    candidateUserId,
    applicationId: "app-1",
    fullName,
    rankPosition: 1,
    totalScore,
    skillScore: totalScore,
    experienceScore: totalScore,
    educationScore: totalScore,
    projectScore: totalScore,
    recommendation: "Hire",
    isAutoRejected: false,
    rejectReason: null,
    strengths: ["Strong communication", "Relevant HR background"],
    weaknesses: ["Limited backend exposure"],
    fitLabel: "StrongFit",
    confidenceScore: totalScore,
    evidence: ["Điểm tổng cao dựa trên bằng chứng hồ sơ."],
    summary: "Solid HR profile with transferable skills.",
    isAiGenerated: true,
  };
}

// Standard mock set for loading the AI Copilot screen with a given candidate pool.
function baseMocks(candidates: Candidate[], extra: MockHandler[] = []): MockHandler[] {
  return [
    {
      method: "GET",
      match: /\/api\/copilot\/jobs$/,
      json: ok([{ jobId: "job-1", title: "Backend Engineer", status: "Approved", applicationCount: candidates.length }]),
    },
    {
      method: "POST",
      match: /\/api\/copilot\/conversations$/,
      json: ok({ conversationId: "conv-1", jobId: "job-1", title: "Backend Engineer", latestRankingSessionId: null }),
    },
    {
      method: "GET",
      match: /\/api\/copilot\/jobs\/job-1\/candidates$/,
      json: ok({ job: JOB, candidates }),
    },
    { method: "GET", match: /\/api\/copilot\/jobs\/job-1\/rules$/, json: ok([]) },
    {
      method: "GET",
      match: /\/api\/copilot\/conversations\/conv-1$/,
      json: ok({ conversationId: "conv-1", jobId: "job-1", title: "Backend Engineer", latestRankingSessionId: null, messages: [] }),
    },
    ...extra,
  ];
}

// E2E-AI-001 — the ranking table must NOT render raw JSON education.
test("E2E-AI-001 education is never rendered as raw JSON", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, baseMocks([candidate()]));

  await page.goto("/hr/ai-copilot");
  await expect(page.getByText("Bùi Hoàng Phúc")).toBeVisible();
  // No raw JSON anywhere on the page.
  await expect(page.getByText('[{"school"')).toHaveCount(0);
  await expect(page.getByText(/"degree":/)).toHaveCount(0);
});

// E2E-AI-002 — education renders school + degree nicely.
test("E2E-AI-002 education renders school and degree", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, baseMocks([candidate()]));

  await page.goto("/hr/ai-copilot");
  await expect(page.getByText("National Economics University")).toBeVisible();
  await expect(page.getByText(/Talent Acquisition Specialist/)).toBeVisible();
});

// E2E-AI-003 — skills render as chips with a "+N" overflow indicator.
test("E2E-AI-003 skills render as chips with +N overflow", async ({ page }) => {
  await seedSession(page, "hr");
  const skills = ["C#", "PostgreSQL", "React", "Docker", "Azure", "SQL", "Redis", "Kafka"]; // 8 skills
  await installApiMocks(page, baseMocks([candidate({ skills })]));

  await page.goto("/hr/ai-copilot");
  await expect(page.getByText("C#", { exact: true })).toBeVisible();
  // SkillTags shows the first 5 chips; the remaining 3 collapse into "+3".
  await expect(page.getByText("+3", { exact: true })).toBeVisible();
  await expect(page.getByText("Kafka", { exact: true })).toHaveCount(0);
});

// E2E-AI-004 — a not-ranked candidate shows the neutral "Chưa chấm" score and the run-review CTA.
test("E2E-AI-004 not-ranked candidate shows neutral score and CTA", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, baseMocks([candidate()]));

  await page.goto("/hr/ai-copilot");
  await expect(page.getByText("Chưa chấm").first()).toBeVisible();
  await expect(page.getByText("Chạy AI review để tạo lý do phù hợp").first()).toBeVisible();
});

// E2E-AI-005 — running an AI review updates the candidate row from the mocked API.
test("E2E-AI-005 run AI review updates the row score", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(
    page,
    baseMocks([candidate()], [
      {
        method: "POST",
        match: /\/api\/copilot\/conversations\/conv-1\/rankings$/,
        json: ok({
          conversationId: "conv-1",
          rankingSessionId: "rank-1",
          didRank: true,
          assistantMessage: "Ranked 1 candidate.",
          normalizedRules: EMPTY_RULES,
          results: [rankingResult("cand-1", "Bùi Hoàng Phúc", 88)],
        }),
      },
    ]),
  );

  await page.goto("/hr/ai-copilot");
  await expect(page.getByText("Chưa chấm").first()).toBeVisible();

  // The chat composer lives in the assistant drawer (v2 UI); open it first.
  await page.getByRole("button", { name: /Trợ lý AI/ }).click();
  await page.getByLabel("Tin nhắn cho trợ lý AI").fill("Rank these candidates");
  await page.getByRole("button", { name: "Gửi", exact: true }).click();

  // The row updates from the mocked ranking response.
  await expect(page.getByText("88/100")).toBeVisible();
  await expect(page.getByText("Đã chấm").first()).toBeVisible();
});

// E2E-AI-007 — v2 hardening: deprecated tools are gone; Pass CV → Head Review selection + action work.
test("E2E-AI-007 deprecated tools removed and Pass CV to Head Review works", async ({ page }) => {
  const passCvRequests: string[] = [];
  await seedSession(page, "hr");
  await installApiMocks(
    page,
    baseMocks([candidate()], [
      {
        method: "POST",
        match: /\/api\/copilot\/conversations\/conv-1\/rankings$/,
        json: ok({
          conversationId: "conv-1",
          rankingSessionId: "rank-1",
          didRank: true,
          assistantMessage: "Đã xếp hạng 1 ứng viên.",
          normalizedRules: EMPTY_RULES,
          results: [rankingResult("cand-1", "Bùi Hoàng Phúc", 88)],
        }),
      },
      {
        method: "POST",
        match: /\/api\/copilot\/ranking-sessions\/rank-1\/pass-cv$/,
        json: ok({
          updated: [{ applicationId: "app-1", oldStatus: "Screening", newStatus: "ManagerReview" }],
          skipped: [],
        }),
      },
    ]),
    {
      onRequest: (method, url) => {
        if (method === "POST" && /\/pass-cv$/.test(url.pathname)) passCvRequests.push(url.pathname);
      },
    },
  );

  await page.goto("/hr/ai-copilot");
  await expect(page.getByText("Bùi Hoàng Phúc")).toBeVisible();

  // The deprecated per-row AI email-draft tool is removed (fit + questions remain).
  await expect(page.getByTitle("Soạn email")).toHaveCount(0);

  // Run ranking from the primary toolbar action (no drawer overlay in the way).
  await page.getByRole("button", { name: /Xếp hạng/ }).first().click();
  await expect(page.getByText("88/100")).toBeVisible();

  // Pass CV → Head Review: select the screening candidate and trigger the explicit HR action.
  const headReviewButton = page.getByRole("button", { name: /Chuyển sang Head Review/ });
  await expect(headReviewButton).toBeVisible();
  await page.getByRole("checkbox").first().check();
  await headReviewButton.click();
  await expect.poll(() => passCvRequests.length).toBeGreaterThan(0);

  // The deprecated candidate-search tool is removed from the assistant drawer.
  await page.getByRole("button", { name: /Trợ lý AI/ }).click();
  await expect(page.getByRole("button", { name: /Tìm ứng viên/ })).toHaveCount(0);
});

// E2E-AI-006 — malformed education JSON must not crash the UI; it falls back gracefully.
test("E2E-AI-006 malformed education data does not crash the UI", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, baseMocks([candidate({ education: '[{"school": "Broken' })]));

  await page.goto("/hr/ai-copilot");
  // Page still renders the candidate (no crash) and shows the friendly fallback, not the raw broken JSON.
  await expect(page.getByText("Bùi Hoàng Phúc")).toBeVisible();
  await expect(page.getByText("Chưa có thông tin học vấn").first()).toBeVisible();
  await expect(page.getByText('[{"school"')).toHaveCount(0);
});
