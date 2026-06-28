import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-WF-001..007 — workflow correctness: Head Review hand-off date, mandatory interview
// scheduling/completion before Offer/Reject, the interview-schedule button fix, and the email-gated
// Offer/Reject transitions. All deterministic via seeded session + /api/** route mocks (no live backend).

type Interview = {
  id: string;
  label: string;
  interviewDate: string;
  status: string;
  notes: string | null;
};

function reviewDetail(over: Record<string, unknown> = {}) {
  return {
    applicationId: "app-1",
    referenceCode: "APP-ABCD1234",
    stageLabel: "Interview",
    status: "Interview",
    offerStatus: null,
    appliedAt: "2026-06-01T09:00:00Z",
    departmentHeadReviewRequestedAt: "2026-06-05T10:00:00Z",
    nextStep: "Tiến hành phỏng vấn",
    candidate: {
      id: "c-1",
      fullName: "Nguyễn Văn A",
      email: "candidate.a@test.local",
      phone: null,
      avatarUrl: null,
      currentPosition: null,
      experienceYears: null,
      education: null,
      address: null,
      bio: null,
      linkedinUrl: null,
      githubUrl: null,
      skills: [],
    },
    job: { id: "job-1", title: "Backend Engineer", departmentName: "Engineering", requiredSkills: [] },
    insights: {
      skillsMatchPercent: 80,
      matchedSkillCount: 4,
      requiredSkillCount: 5,
      submittedInterviewNotes: 0,
      totalInterviews: 0,
    },
    interviews: [] as Interview[],
    reviewedBy: null,
    ...over,
  };
}

const SCHEDULED_INTERVIEW: Interview = {
  id: "int-1",
  label: "Interview Round 1",
  interviewDate: "2026-07-01T02:00:00Z",
  status: "Scheduled",
  notes: null,
};

const COMPLETED_INTERVIEW: Interview = { ...SCHEDULED_INTERVIEW, status: "Completed" };

const OFFER_EDITOR = {
  application: {
    applicationId: "app-1",
    referenceCode: "APP-ABCD1234",
    stageLabel: "Interview",
    candidateName: "Nguyễn Văn A",
    candidateEmail: "candidate.a@test.local",
    candidateAvatarUrl: null,
    jobTitle: "Backend Engineer",
    departmentName: "Engineering",
  },
  offer: {
    offerId: null,
    status: "Draft",
    offerTemplateId: null,
    baseSalary: 2500,
    currencyCode: "USD",
    bonusDescription: null,
    equityNotes: null,
    employmentType: "Full-time",
    proposedStartDate: null,
    probationPeriod: "2 Months",
    reportingManagerId: null,
    reportingManagerName: null,
    personalMessage: null,
    benefitIds: [] as string[],
    sentAt: null,
    updatedAt: null,
  },
  masterData: {
    templates: [],
    benefits: [],
    currencies: [{ code: "USD", name: "US Dollar", symbol: "$" }],
    employmentTypes: ["Full-time", "Part-time"],
    reportingManagers: [],
  },
};

// E2E-WF-001 — Manager/DepartmentHead review list shows "received for review" date, not applied date.
test("E2E-WF-001 manager review list shows received-for-review date", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    {
      method: "GET",
      match: /\/api\/manager\/applications\/review-queue$/,
      json: ok({
        items: [
          {
            applicationId: "app-1",
            candidateName: "Nguyễn Văn A",
            candidateInitials: "NA",
            candidateAvatarUrl: null,
            candidateLocation: "Hà Nội",
            jobTitle: "Backend Engineer",
            score: 82,
            recommendation: "Hire",
            status: "ManagerReview",
            appliedAt: "2026-06-01T09:00:00Z",
            departmentHeadReviewRequestedAt: "2026-06-05T10:00:00Z",
            completedInterviews: 0,
            totalInterviews: 0,
          },
        ],
        meta: { page: 1, pageSize: 8, totalItems: 1, totalPages: 1 },
        summary: { pendingFinalApprovals: 1, recommendedCount: 1, flaggedCount: 0, averageScore: 82 },
      }),
    },
  ]);

  await page.goto("/manager/applications");
  const row = page.locator("table tbody tr", { hasText: "Backend Engineer" });
  await expect(row).toBeVisible();
  // The primary work date is "Nhận review" (departmentHeadReviewRequestedAt), applied date is secondary.
  await expect(row.getByText(/Nhận review/)).toBeVisible();
  await expect(row.getByText(/Ứng tuyển/)).toBeVisible();
});

// E2E-WF-002 — Application in Interview with no interview: HR sees "schedule interview required",
// Offer/Reject are gated.
test("E2E-WF-002 interview stage with no interview prompts scheduling and gates decisions", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    { method: "GET", match: /\/api\/hr\/applications\/app-1$/, json: ok(reviewDetail({ interviews: [] })) },
  ]);

  await page.goto("/hr/applications/app-1");
  await expect(page.getByText("Cần lên lịch phỏng vấn")).toBeVisible();
  await expect(page.getByRole("link", { name: /Lên lịch phỏng vấn/ }).first()).toBeVisible();
  // Offer/Reject must be gated with a visible reason.
  await expect(page.getByRole("button", { name: /Gửi email offer/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Gửi email từ chối/ })).toBeDisabled();
  await expect(page.getByText("Hãy lên lịch phỏng vấn trước.").first()).toBeVisible();
});

// E2E-WF-003 — Schedule Interview confirm button is ENABLED when required fields are valid (the fix:
// it no longer requires the Manager-only INTERVIEW_APPROVE permission).
test("E2E-WF-003 schedule interview confirm button enables when form is valid", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    {
      method: "GET",
      match: /\/api\/hr\/interviews\/schedule-data$/,
      json: ok({
        candidate: {
          id: "c-1",
          applicationId: "app-1",
          jobId: "job-1",
          name: "Nguyễn Văn A",
          roleLabel: "Backend Engineer",
          appliedFor: "Backend Engineer",
          avatarUrl: null,
        },
        interviewers: [
          { id: "iv-1", name: "Người Phỏng Vấn", title: "HR", avatarUrl: "", busySlotsByDate: {} },
        ],
        slotMinutes: [540, 600, 660],
      }),
    },
  ]);

  await page.goto("/hr/interviews/schedule?applicationId=app-1");
  const confirm = page.getByRole("button", { name: /Xác nhận lịch phỏng vấn/ });
  await expect(confirm).toBeVisible();
  // Before a link is entered, the reason is shown and the button is disabled.
  await expect(confirm).toBeDisabled();
  await page.getByPlaceholder("Dán link cuộc họp").fill("https://meet.example/interview");
  // With a slot auto-selected, a free interviewer and a link, the confirm button is enabled.
  await expect(confirm).toBeEnabled();
});

// E2E-WF-004 — Offer/Reject disabled before the interview is completed.
test("E2E-WF-004 offer and reject are disabled until interview completed", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    {
      method: "GET",
      match: /\/api\/hr\/applications\/app-1$/,
      json: ok(reviewDetail({ interviews: [SCHEDULED_INTERVIEW] })),
    },
  ]);

  await page.goto("/hr/applications/app-1");
  await expect(page.getByRole("button", { name: /Đánh dấu đã phỏng vấn/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Gửi email offer/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /Gửi email từ chối/ })).toBeDisabled();
  await expect(page.getByText("Hãy hoàn tất phỏng vấn trước khi gửi offer/từ chối.").first()).toBeVisible();
});

// E2E-WF-005 — Mark interview completed; the Send Offer Email action becomes enabled (a link).
test("E2E-WF-005 marking interview completed unlocks the offer email action", async ({ page }) => {
  await seedSession(page, "hr");
  let completed = false;
  await installApiMocks(
    page,
    [
      {
        method: "GET",
        match: /\/api\/hr\/applications\/app-1$/,
        json: () => ok(reviewDetail({ interviews: [completed ? COMPLETED_INTERVIEW : SCHEDULED_INTERVIEW] })),
      },
      { method: "PATCH", match: /\/api\/hr\/interviews\/int-1\/status$/, json: ok(null) },
    ],
    {
      onRequest: (method, url) => {
        if (method === "PATCH" && /\/api\/hr\/interviews\/int-1\/status$/.test(url.pathname)) {
          completed = true;
        }
      },
    },
  );

  await page.goto("/hr/applications/app-1");
  await expect(page.getByRole("button", { name: /Gửi email offer/ })).toBeDisabled();
  await page.getByRole("button", { name: /Đánh dấu đã phỏng vấn/ }).click();
  // After completion + refresh, the offer action is an enabled link to the send-offer screen.
  await expect(page.getByRole("link", { name: /Gửi email offer/ })).toBeVisible();
});

// E2E-WF-006 — Sending the offer calls the offer email endpoint and surfaces success.
test("E2E-WF-006 send offer calls the offer email endpoint", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    { method: "GET", match: /\/api\/hr\/applications\/app-1\/offer$/, json: ok(OFFER_EDITOR) },
    {
      method: "POST",
      match: /\/api\/hr\/applications\/app-1\/offer\/send$/,
      json: ok({ ...OFFER_EDITOR, offer: { ...OFFER_EDITOR.offer, status: "Sent" } }, "Đã gửi offer thành công."),
    },
  ]);

  await page.goto("/hr/applications/app-1/send-offer");
  const sendButton = page.getByRole("button", { name: /Gửi offer qua email/ });
  await expect(sendButton).toBeVisible();

  const sendRequest = page.waitForRequest(
    (req) => req.method() === "POST" && /\/api\/hr\/applications\/app-1\/offer\/send$/.test(req.url()),
  );
  await sendButton.click();
  const request = await sendRequest;
  expect(request.url()).toContain("/api/hr/applications/app-1/offer/send");
  await expect(page.getByText("Đã gửi offer thành công.")).toBeVisible();
});

// E2E-WF-007 — Sending the rejection email calls the rejection endpoint and the status becomes Rejected.
test("E2E-WF-007 send rejection email calls the rejection endpoint and shows Rejected", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    {
      method: "GET",
      match: /\/api\/hr\/applications\/app-1$/,
      json: ok(reviewDetail({ interviews: [COMPLETED_INTERVIEW] })),
    },
    {
      method: "POST",
      match: /\/api\/hr\/applications\/app-1\/rejection-email$/,
      json: ok(reviewDetail({ status: "Rejected", interviews: [COMPLETED_INTERVIEW] }), "Đã từ chối"),
    },
  ]);

  await page.goto("/hr/applications/app-1");
  const rejectButton = page.getByRole("button", { name: /Gửi email từ chối/ });
  await expect(rejectButton).toBeEnabled();
  await rejectButton.click();

  // The rejection email modal opens with a subject/body to send.
  await expect(page.getByRole("heading", { name: "Gửi email từ chối" })).toBeVisible();

  const rejectRequest = page.waitForRequest(
    (req) => req.method() === "POST" && /\/api\/hr\/applications\/app-1\/rejection-email$/.test(req.url()),
  );
  await page.getByRole("button", { name: /Gửi email & từ chối/ }).click();
  const request = await rejectRequest;
  expect(request.url()).toContain("/api/hr/applications/app-1/rejection-email");

  const body = JSON.parse(request.postData() ?? "{}");
  expect(body.subject?.length ?? 0).toBeGreaterThan(0);
  expect(body.body?.length ?? 0).toBeGreaterThan(0);

  // After a successful send the application is shown as Rejected (English canonical label).
  await expect(page.getByText("Rejected").first()).toBeVisible();
});
