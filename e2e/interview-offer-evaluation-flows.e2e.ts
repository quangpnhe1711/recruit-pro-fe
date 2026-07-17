import { test, expect } from "@playwright/test";
import { installApiMocks, ok, seedSession } from "./support/session";

// E2E-FLOW-101..104 — the flow-gap fixes: candidate meeting info + attendance confirmation,
// candidate offer view before accept/decline, HR interview-row navigation to the application
// review, and the post-interview evaluation scorecard. Deterministic via seeded session +
// /api/** route mocks (no live backend).

const DAY_MS = 24 * 60 * 60 * 1000;
const tomorrow = new Date(Date.now() + DAY_MS);
const tomorrowEnd = new Date(tomorrow.getTime() + 60 * 60 * 1000);

function candidateInterview(over: Record<string, unknown> = {}) {
  return {
    id: "int-1",
    candidateName: "Phùng Nhật Quang",
    candidateEmail: "candidate@test.local",
    jobTitle: "Backend Engineer",
    interviewer: "Nguyễn Thục Uyên",
    dateLabel: "Jul 17, 2026",
    timeLabel: "09:00 - 10:00",
    startAt: tomorrow.toISOString(),
    endAt: tomorrowEnd.toISOString(),
    status: "Scheduled",
    meetingType: "Online",
    meetingLink: "https://meet.example/interview-room",
    location: null,
    candidateConfirmedAt: null,
    ...over,
  };
}

function hrInterview(over: Record<string, unknown> = {}) {
  return {
    id: "int-1",
    applicationId: "app-1",
    candidateName: "Nguyễn Văn A",
    candidateEmail: "candidate.a@test.local",
    jobTitle: "Backend Engineer",
    interviewer: "RecruitPro HR",
    dateLabel: "Jul 17, 2026",
    timeLabel: "09:00 - 10:00",
    startAt: tomorrow.toISOString(),
    endAt: tomorrowEnd.toISOString(),
    status: "Scheduled",
    meetingType: "Online",
    meetingLink: "https://meet.example/interview-room",
    location: null,
    candidateConfirmedAt: null,
    evaluationOverallScore: null,
    evaluationRecommendation: null,
    ...over,
  };
}

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
      totalInterviews: 1,
    },
    interviews: [],
    reviewedBy: null,
    ...over,
  };
}

// E2E-FLOW-101 — Candidate sees the meeting format + join link and can confirm attendance.
test("E2E-FLOW-101 candidate sees meeting link and confirms attendance", async ({ page }) => {
  await seedSession(page, "candidate");
  await installApiMocks(page, [
    {
      method: "GET",
      match: /\/api\/candidate\/interviews$/,
      json: ok({ items: [candidateInterview()] }),
    },
    {
      method: "POST",
      match: /\/api\/candidate\/interviews\/int-1\/confirm$/,
      json: ok("Đã xác nhận tham dự phỏng vấn."),
    },
  ]);

  await page.goto("/candidate/interviews");
  await expect(page.getByRole("heading", { name: "Lịch phỏng vấn" })).toBeVisible();

  // Meeting format tile + join link with the mocked meeting URL.
  await expect(page.getByText("Phỏng vấn trực tuyến")).toBeVisible();
  const joinLink = page.getByRole("link", { name: /Vào phòng phỏng vấn/ });
  await expect(joinLink).toBeVisible();
  await expect(joinLink).toHaveAttribute("href", "https://meet.example/interview-room");

  // Confirm attendance: button → POST /confirm → confirmed chip replaces the button.
  const confirmRequest = page.waitForRequest(
    (req) => req.method() === "POST" && /\/api\/candidate\/interviews\/int-1\/confirm$/.test(req.url()),
  );
  await page.getByRole("button", { name: /Xác nhận tham dự/ }).click();
  await confirmRequest;
  // Both the success toast and the chip contain the text — .first() avoids strict-mode ambiguity.
  await expect(page.getByText("Đã xác nhận tham dự").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Xác nhận tham dự/ })).toHaveCount(0);
});

// E2E-FLOW-102 — Candidate opens the offer details before responding, then accepts from the modal.
test("E2E-FLOW-102 candidate views offer terms then accepts from the modal", async ({ page }) => {
  await seedSession(page, "candidate");
  await installApiMocks(page, [
    {
      method: "GET",
      match: /\/api\/candidate\/applications$/,
      json: ok({
        items: [
          {
            id: "app-1",
            jobId: "job-1",
            jobTitle: "Backend Engineer",
            companyOrDepartment: "Engineering",
            appliedDate: "2026-06-01T08:00:00Z",
            status: "Offer",
            statusLabel: "Đã có offer",
            nextStep: "Phản hồi offer",
            availableActions: ["acceptOffer", "declineOffer"],
          },
        ],
        summary: { total: 1, active: 1, closed: 0 },
      }),
    },
    { method: "GET", match: /\/api\/candidate\/interviews$/, json: ok({ items: [] }) },
    {
      method: "GET",
      match: /\/api\/candidate\/applications\/app-1\/offer$/,
      json: ok({
        applicationId: "app-1",
        jobTitle: "Backend Engineer",
        departmentName: "Engineering",
        status: "Sent",
        baseSalary: 50000000,
        currencyCode: "VND",
        currencySymbol: "₫",
        bonusDescription: "Thưởng hiệu suất theo quý",
        equityNotes: null,
        employmentType: "Full-time",
        proposedStartDate: "2026-08-03T00:00:00Z",
        probationPeriod: "2 Months",
        reportingManagerName: "Nguyễn Thục Uyên",
        personalMessage: "Chào mừng bạn gia nhập đội ngũ!",
        benefits: ["Bảo hiểm sức khỏe", "13th month salary"],
        sentAt: "2026-07-15T09:00:00Z",
      }),
    },
    { method: "POST", match: /\/api\/candidate\/applications\/app-1\/accept-offer$/, json: ok(null) },
  ]);

  await page.goto("/candidate/my-applications");
  await page.getByRole("button", { name: "Xem offer" }).first().click();

  // The offer modal shows the terms the candidate is about to respond to.
  await expect(page.getByText("Chi tiết offer")).toBeVisible();
  await expect(page.getByText("50.000.000")).toBeVisible();
  await expect(page.getByText("Bảo hiểm sức khỏe")).toBeVisible();
  await expect(page.getByText("Thưởng hiệu suất theo quý")).toBeVisible();
  await expect(page.getByText("Chào mừng bạn gia nhập đội ngũ!")).toBeVisible();

  // Accept from the modal footer → the shared ConfirmModal opens on top → confirm fires the API call.
  await page
    .locator(".fixed.inset-0")
    .filter({ hasText: "Chi tiết offer" })
    .getByRole("button", { name: "Nhận offer" })
    .click();
  const confirmDialog = page.getByRole("dialog", { name: "Nhận offer" });
  await expect(confirmDialog).toBeVisible();

  const acceptRequest = page.waitForRequest(
    (req) => req.method() === "POST" && /\/api\/candidate\/applications\/app-1\/accept-offer$/.test(req.url()),
  );
  await confirmDialog.getByRole("button", { name: "Nhận offer" }).click();
  await acceptRequest;
  await expect(page.getByText("Bạn đã xác nhận nhận offer.")).toBeVisible();
});

// E2E-FLOW-103 — HR interview row click navigates to the application review (no more toast dead-end);
// the row also surfaces the candidate's attendance confirmation.
test("E2E-FLOW-103 HR interview row navigates to application review and shows confirmation chip", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(page, [
    {
      method: "GET",
      match: /\/api\/hr\/interviews$/,
      json: ok({
        items: [hrInterview({ candidateConfirmedAt: "2026-07-16T08:00:00Z" })],
        meta: { page: 1, pageSize: 1000, totalItems: 1, totalPages: 1 },
      }),
    },
    { method: "GET", match: /\/api\/hr\/applications\/app-1$/, json: ok(reviewDetail()) },
  ]);

  await page.goto("/hr/interviews");
  const row = page.locator("table tbody tr", { hasText: "Nguyễn Văn A" });
  await expect(row).toBeVisible();
  // Candidate attendance confirmation is visible to HR on the Scheduled row.
  await expect(row.getByText("ƯV đã xác nhận")).toBeVisible();

  await row.click();
  await expect(page).toHaveURL(/\/hr\/applications\/app-1$/);
  await expect(page.getByText("APP-ABCD1234")).toBeVisible();
});

// E2E-FLOW-104 — Post-interview evaluation scorecard: blank form (404), score 4 criteria, pick a
// recommendation, save via PUT, and the list row shows the evaluation summary chip.
test("E2E-FLOW-104 HR fills the evaluation scorecard for a completed interview", async ({ page }) => {
  await seedSession(page, "hr");
  await installApiMocks(
    page,
    [
    {
      method: "GET",
      match: /\/api\/hr\/interviews$/,
      json: ok({
        items: [hrInterview({ status: "Completed" })],
        meta: { page: 1, pageSize: 1000, totalItems: 1, totalPages: 1 },
      }),
    },
    {
      method: "GET",
      match: /\/api\/hr\/interviews\/int-1\/evaluation$/,
      status: 404,
      json: { success: false, message: "Không tìm thấy dữ liệu.", statusCode: 404, data: null },
    },
    {
      method: "PUT",
      match: /\/api\/hr\/interviews\/int-1\/evaluation$/,
      json: (_url: URL, body: string | null) => {
        const payload = JSON.parse(body ?? "{}");
        return ok(
          {
            interviewId: "int-1",
            evaluatorId: "u-hr-1",
            evaluatorName: "Nguyễn Thục Uyên",
            technicalScore: payload.technicalScore,
            communicationScore: payload.communicationScore,
            problemSolvingScore: payload.problemSolvingScore,
            cultureFitScore: payload.cultureFitScore,
            overallScore: 85,
            recommendation: payload.recommendation,
            strengths: payload.strengths,
            concerns: payload.concerns,
            notes: payload.notes,
            createdAt: "2026-07-16T09:00:00Z",
            updatedAt: "2026-07-16T09:00:00Z",
          },
          "Đã lưu đánh giá phỏng vấn.",
        );
      },
    },
    ],
  );

  await page.goto("/hr/interviews");
  const row = page.locator("table tbody tr", { hasText: "Nguyễn Văn A" });
  await expect(row).toBeVisible();

  // Open the actions menu → "Đánh giá" (only offered for Completed interviews). Icon ligature
  // text (rate_review) is part of the accessible name, so match by regex.
  await row.getByRole("button", { name: "Thao tác" }).click();
  // A real mouse click here also guards the outside-click regression: CommonTable renders the
  // menu twice (desktop + mobile), and the old ref-containment check closed the menu on mousedown.
  const evaluateItem = page.getByRole("button", { name: /Đánh giá$/ });
  await expect(evaluateItem).toBeVisible();
  await evaluateItem.click();

  // Blank scorecard (the 404 means "not evaluated yet"); save is gated with a visible reason.
  await expect(page.getByRole("heading", { name: "Đánh giá phỏng vấn" })).toBeVisible();
  await expect(page.getByText("Chấm đủ 4 tiêu chí để lưu.")).toBeVisible();
  const saveButton = page.getByRole("button", { name: /Lưu đánh giá/ });
  await expect(saveButton).toBeDisabled();

  // Score the 4 criteria: 4 + 4 + 4 + 5 = 17/20 → 85/100. Scope each score row via the
  // criterion label's parent so the buttons can't be confused across rows.
  const criterion = (label: string) =>
    page.getByText(label, { exact: true }).locator("..");
  await criterion("Chuyên môn kỹ thuật").getByRole("button", { name: "4", exact: true }).click();
  await criterion("Giao tiếp").getByRole("button", { name: "4", exact: true }).click();
  await criterion("Giải quyết vấn đề").getByRole("button", { name: "4", exact: true }).click();
  await criterion("Phù hợp văn hóa").getByRole("button", { name: "5", exact: true }).click();
  await expect(page.getByText("85/100").first()).toBeVisible();

  // Recommendation still required before saving.
  await expect(page.getByText("Chọn đề xuất tuyển dụng.")).toBeVisible();
  await page.getByRole("button", { name: "Nên tuyển", exact: true }).click();
  await expect(saveButton).toBeEnabled();

  const putRequest = page.waitForRequest(
    (req) => req.method() === "PUT" && /\/api\/hr\/interviews\/int-1\/evaluation$/.test(req.url()),
  );
  await saveButton.click();
  const request = await putRequest;
  const body = JSON.parse(request.postData() ?? "{}");
  expect(body.technicalScore).toBe(4);
  expect(body.cultureFitScore).toBe(5);
  expect(body.recommendation).toBe("Hire");

  // Saved: toast + the row now carries the evaluation summary chip.
  await expect(page.getByText("Đã lưu đánh giá phỏng vấn.")).toBeVisible();
  await expect(row.getByText("Đánh giá: 85/100")).toBeVisible();
});
